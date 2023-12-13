import {lookupArchive} from "@subsquid/archive-registry"
import * as ss58 from "@subsquid/ss58"
import {SubstrateBatchProcessor, Block, DataHandlerContext, SubstrateBatchProcessorFields} from "@subsquid/substrate-processor"
import {Store, TypeormDatabase} from "@subsquid/typeorm-store"
import {In} from "typeorm"
import {Core, Staker} from "./model"
import {stakerClaimed as OcifStakingStakerClaimedEvent, coreClaimed as OcifStakingCoreClaimedEvent} from "./types/ocif-staking/events"
import {events} from './types'
import { EntityManager } from 'typeorm'
import assert from "assert"
import { hexToU8a } from '@polkadot/util';


const processor = new SubstrateBatchProcessor()
    .setDataSource({
        archive: lookupArchive("invarch-tinkernet", { release: "ArrowSquid" }),
        chain: {
        	url: 'https://tinkernet-rpc.dwellir.com',
        	rateLimit: 10
        }
    })
    .addEvent({
        name: [ 'OcifStaking.StakerClaimed' ],
        call: true,
        extrinsic: true
    })
    .addEvent({
        name: [ 'OcifStaking.CoreClaimed' ],
        call: true,
        extrinsic: true
    })
    .setFields({
        event: {
            args: true
        }
    })

type Item = SubstrateBatchProcessorFields<typeof processor>
type Ctx = DataHandlerContext<Store, Item>


processor.run(new TypeormDatabase(), async ctx => {
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

    for (let c of output) {
            let {typ, id, blockNumber, account, total, coreId} = c

            if (typ == "staker") {
                let stkr = await ctx.store.findOneBy(Staker, {account});

                const totalRewards = stkr ? stkr.totalRewards + total : total;

                await ctx.store.save(new Staker({
                    id, latestClaimBlock: blockNumber, account, totalRewards, totalUnclaimed: BigInt(0)
                     }));
            }
            else {
                let cor = await ctx.store.findOneBy(Core, {coreId});

                const totalRewards = cor ? cor.totalRewards + total : total;

                await ctx.store.save(new Core({
                    id, latestClaimBlock: blockNumber, coreId, totalRewards
                }));
            }
        }
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
        for (let item of block.events) {
            if (item.name == "OcifStaking.StakerClaimed") {

                let data: {staker: string, core: number, era: number, amount: bigint}
                if (events.ocifStaking.stakerClaimed.v15.is(item)) {
                    let {staker, core, era, amount} = events.ocifStaking.stakerClaimed.v15.decode(item)
                    data = {staker, core, era, amount}
                } else {
                    throw new Error('Unsupported spec')
                }

                claims.push({
                    typ: "staker",
                    id: ss58.codec(117).encode(hexToU8a(data.staker)),
                    blockNumber: block.header.height,
                    account: ss58.codec(117).encode(hexToU8a(data.staker)),
                    total: data.amount,
                    coreId: data.core
                })
            } else if (item.name == "OcifStaking.CoreClaimed") {

                let data: {core: number, destinationAccount: string, era: number, amount: bigint}
                if (events.ocifStaking.coreClaimed.v15.is(item)) {
                    let {core, destinationAccount, era, amount} = events.ocifStaking.coreClaimed.v15.decode(item)
                    data = {core, destinationAccount, era, amount}
                } else {
                    throw new Error('Unsupported spec')
                }

                claims.push({
                    typ: "core",
                    id: data.core.toString(),
                    blockNumber: block.header.height,
                    account: ss58.codec(117).encode(hexToU8a(data.destinationAccount)),
                    total: data.amount,
                    coreId: data.core
                })
            }
        }
    }
    return claims
}
