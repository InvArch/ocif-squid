import {lookupArchive} from "@subsquid/archive-registry"
import * as ss58 from "@subsquid/ss58"
import {BatchContext, BatchProcessorItem, SubstrateBatchProcessor} from "@subsquid/substrate-processor"
import {Store, TypeormDatabase} from "@subsquid/typeorm-store"
import {In} from "typeorm"
import {Core, Staker} from "./model"
import {OcifStakingStakerClaimedEvent, OcifStakingCoreClaimedEvent} from "./types/events"
import { EntityManager } from 'typeorm'
import SquidCache from './squid-cache';


const processor = new SubstrateBatchProcessor()
    .setDataSource({
        archive: 'https://brainstorm.invarch.network/graphql',
        // archive: 'http://localhost:8888/graphql'
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


type Item = BatchProcessorItem<typeof processor>
type Ctx = BatchContext<Store, Item>


processor.run(new TypeormDatabase(), async ctx => {
    SquidCache.init(ctx, [Core, Staker]);

    let claims = await getClaims(ctx)

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

    await SquidCache.load();

    for (let c of output) {
            let {typ, id, blockNumber, account, total, coreId} = c

            if (typ == "staker") {
                await SquidCache.deferredLoad(Staker, id);
                let stkr = SquidCache.get(Staker, id);

                const totalRewards = stkr ? stkr.totalRewards + total : total;

                SquidCache.upsert(new Staker({
                    id, latestClaimBlock: blockNumber, account, totalRewards, totalUnclaimed: BigInt(0)
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
                    id: data.staker.toString(),
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
