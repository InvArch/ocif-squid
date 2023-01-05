import {lookupArchive} from "@subsquid/archive-registry"
import * as ss58 from "@subsquid/ss58"
import {BatchContext, BatchProcessorItem, SubstrateBatchProcessor} from "@subsquid/substrate-processor"
import {Store, TypeormDatabase} from "@subsquid/typeorm-store"
import {In} from "typeorm"
import {Core, Staker} from "./model"
import {OcifStakingStakerClaimedEvent, OcifStakingCoreClaimedEvent, OcifStakingNewEraEvent} from "./types/events"
import {EraInfo, StakerInfo, RewardInfo, EraStake} from "./types/v14"
import {Block} from "./types/support"
import {OcifStakingGeneralEraInfoStorage, OcifStakingCurrentEraStorage, OcifStakingGeneralStakerInfoStorage, OcifStakingRegisteredCoreStorage, OcifStakingLedgerStorage} from "./types/storage"
import { EntityManager } from 'typeorm'
import SquidCache from './squid-cache';
import {Big} from "big.js";


const processor = new SubstrateBatchProcessor()
    .setDataSource({
         archive: 'https://brainstorm.invarch.network/graphql',
        // archive: 'http://localhost:8888/graphql',

         chain: 'wss://brainstorm.invarch.network'
        // chain: 'ws://localhost:9965'
    })
    .addEvent('OcifStaking.StakerClaimed', {
        data: {
            event: {
                args: true,
                extrinsic: {
                    hash: true,
                    fee: true
                }
            }
        }
    } as const)
    .addEvent('OcifStaking.CoreClaimed', {
        data: {
            event: {
                args: true,
                extrinsic: {
                    hash: true,
                    fee: true
                }
            }
        }
    } as const)
    .addEvent('OcifStaking.NewEra', {
        data: {
            event: {
                args: true,
                extrinsic: {
                    hash: true,
                    fee: true
                }
            }
        }
    } as const)

type Item = BatchProcessorItem<typeof processor>
type Ctx = BatchContext<Store, Item>


processor.run(new TypeormDatabase(), async ctx => {
    SquidCache.init(ctx, [Core, Staker]);

    let claims = await getClaims(ctx);

    const output: ClaimEvent[] = claims.reduce((acc: ClaimEvent[], line: ClaimEvent) => {
        const ndx = acc.findIndex(e => e.id === line.id);

        if (ndx > -1) {
            acc[ndx].total = (acc[ndx].total || BigInt(0)) + line.total;
            acc[ndx].blockNumber = line.blockNumber;
        } else {
            acc.push(line);
        }

        return acc;
    }, []);

    let newEras = await getNewEras(ctx);

    await SquidCache.load();

    for (const newEra of newEras) {
        for (const {account, rewards} of newEra.unclaimedRewards) {
            await SquidCache.deferredLoad(Staker, account);
            let stkr = SquidCache.get(Staker, account);

            if (stkr) {
                SquidCache.upsert(new Staker({
                    id: stkr.id, latestClaimBlock: stkr.latestClaimBlock, account: stkr.account, totalRewards: stkr.totalRewards, totalUnclaimed: stkr.totalUnclaimed + rewards
                }))

            } else {
                SquidCache.upsert(new Staker({
                    id: account, latestClaimBlock: 0, account, totalRewards: BigInt(0), totalUnclaimed: rewards
                }))
            }

        }
    }

    for (let c of output) {
            let {typ, id, blockNumber, account, total, coreId} = c

            if (typ == "staker") {
                await SquidCache.deferredLoad(Staker, id);
                let stkr = SquidCache.get(Staker, id);

                const totalRewards = stkr ? stkr.totalRewards + total : total;

                if (account == "FSFDCf8KF5x2MvgV3sANfx1yGDvn5oLS5Lj5XH1KRN57g69") {
                console.log("totalRewards: ", totalRewards)
                }

                SquidCache.upsert(new Staker({
                    id, latestClaimBlock: blockNumber, account, totalRewards, totalUnclaimed: stkr ? ((stkr.totalUnclaimed - total) < BigInt("10000000") ? BigInt(0) : stkr.totalUnclaimed - total ) : BigInt(0)
                }))
            }
            else {
                await SquidCache.deferredLoad(Core, id);
                let cor = SquidCache.get(Core, id);

                const totalRewards = cor ? cor.totalRewards + total : total;

                SquidCache.upsert(new Core({
                    id, latestClaimBlock: blockNumber, coreId, totalRewards
                }))
            }
        }

    await SquidCache.flush();
    SquidCache.purge();
})


interface ClaimEvent {
    typ: string
    id: string
    blockNumber: number
    account: string
    total: bigint,
    coreId: number,
}

async function getClaims(ctx: Ctx): Promise<ClaimEvent[]> {
    let claims: ClaimEvent[] = []

    for (let block of ctx.blocks) {

        for (let item of block.items) {
            if (item.name == "OcifStaking.StakerClaimed") {
                let e = new OcifStakingStakerClaimedEvent(ctx, item.event)
                let data: {staker: Uint8Array, core: number, era: number, amount: bigint}

                if (e.isV14) {
                    data = e.asV14
                } else {
                    throw new Error('Unsupported spec')
                }

                claims.push({
                    typ: "staker",
                    id: ss58.codec('kusama').encode(data.staker),
                    blockNumber: block.header.height,
                    account: ss58.codec('kusama').encode(data.staker),
                    total: data.amount,
                    coreId: data.core
                })
            } else if (item.name == "OcifStaking.CoreClaimed") {
                let e = new OcifStakingCoreClaimedEvent(ctx, item.event)
                let data: {core: number, destinationAccount: Uint8Array, era: number, amount: bigint}

                if (e.isV14) {
                    data = e.asV14
                    } else {
                    throw new Error('Unsupported spec')
                }

                claims.push({
                    typ: "core",
                    id: data.core.toString(),
                    blockNumber: block.header.height,
                    account: ss58.codec('kusama').encode(data.destinationAccount),
                    total: data.amount,
                    coreId: data.core
                })
            }
        }
    }
    return claims
}

interface NewEra {
    era: number,
    info: EraInfo,
    unclaimedRewards: {account: string; rewards: bigint}[]
}

async function getNewEras(ctx: Ctx): Promise<NewEra[]> {
    let newEras: NewEra[] = [];

    for (let block of ctx.blocks) {

        for (let item of block.items) {
            if (item.name == "OcifStaking.NewEra") {
                let e = new OcifStakingNewEraEvent(ctx, item.event)
                let data: {era: number}

                if (e.isV14) {
                    data = e.asV14
                } else {
                    throw new Error('Unsupported spec')
                }

                if (data.era > 1) {

                let generalEraInfoStorage = new OcifStakingGeneralEraInfoStorage(ctx, block.header)
                let info = (await generalEraInfoStorage.asV14.get(data.era - 1))

                if (info) {
                    let thisEra: NewEra = {era: data.era - 1, info, unclaimedRewards: []};

                    let ledgerStorage = new OcifStakingLedgerStorage(ctx, block.header)
                let ledgers = (await ledgerStorage.asV14.getPairs())

                    if (ledgers) {
                        for (const [accountId, ledger] of ledgers) {

                            let unlockingChunksSum: Big = ledger.unbondingInfo.unlockingChunks.reduce((acc, chunk) => {

                                if (chunk.unlockEra <= thisEra.era + 7) {
                                    acc = acc.plus(Big(chunk.amount.toString()));
                                }
                                    return acc;
                            }, Big(0));
                            let ledgerLocked = Big(ledger.locked.toString()).minus(unlockingChunksSum);

                            if (ledgerLocked > Big(0)) {

                                const rewards = thisEra.info.staked ? Big(thisEra.info.rewards.stakers.toString()).div( Big(thisEra.info.staked.toString())).times(ledgerLocked) : Big(0);

                                if (ss58.codec('kusama').encode(accountId) == "FSFDCf8KF5x2MvgV3sANfx1yGDvn5oLS5Lj5XH1KRN57g69") {
                                    console.log("ledgerLocked: ", ledgerLocked.toString())
                                    console.log("rewards: ", rewards.toString())
                                    console.log("thisEra.era: ", thisEra.era)
                                    console.log("thisEra.info: ", thisEra.info)

                                    console.log("asasa: ", Big(thisEra.info.rewards.stakers.toString()).div( Big(thisEra.info.staked.toString())).times(ledgerLocked).round(0, Big.roundDown).toString())
                                    console.log(Big(thisEra.info.rewards.stakers.toString()).div( Big(thisEra.info.staked.toString())).round(0, Big.roundDown).toString())
                                }

                            thisEra.unclaimedRewards.push({
                                account: ss58.codec('kusama').encode(accountId),
                                rewards: BigInt(rewards.round(0, Big.roundDown).toString())
                            })

                            }
                        }
                    }

                    newEras.push(thisEra);

                }
                }

                }
        }
    }
    return newEras
}
