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
        // Lookup archive by the network name in the Subsquid registry
        //archive: lookupArchive("kusama", {release: "FireSquid"})

        // Use archive created by archive/docker-compose.yml
        archive: 'https://brainstorm.invarch.network/graphql',
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

    await SquidCache.load();

    let cores: Core[] = [];
    let stakers: Staker[] = [];

    for (let c of claims) {
        let {typ, id, blockNumber, account, total, coreId} = c

        if (typ == "staker") {
            SquidCache.upsert(new Staker({
                    id, latestClaimBlock: blockNumber, account, totalRewards: total, totalUnclaimed: BigInt(0)
                }))
        }
        else {
            SquidCache.upsert(new Core({
                id, latestClaimBlock: blockNumber, coreId, totalRewards: total
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

                let a = claims.find(t => t.id === data.staker.toString())?.total;

                if (!a) {
                    let a = (await SquidCache.get(Staker, data.staker.toString()))?.totalRewards;
                }

                let amount = data.amount;
                if (a) {
                    amount += a;
                }

                claims.push({
                    typ: "staker",
                    id: data.staker.toString(),
                    blockNumber: block.header.height,
                    account: ss58.codec('kusama').encode(data.staker),
                    total: amount,
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

                let a = claims.find(t => t.account === data.destinationAccount.toString())?.total;

                if (!a) {
                    let a = (await SquidCache.get(Core, data.core.toString()))?.totalRewards;
                }

                let amount = data.amount;
                if (a) {
                    amount += a;
                }

                claims.push({
                    typ: "core",
                    id: item.event.id,
                    blockNumber: block.header.height,
                    account: ss58.codec('kusama').encode(data.destinationAccount),
                    total: amount,
                    coreId: data.core
                })
            }
        }
    }
    return claims
}
