import { lookupArchive } from "@subsquid/archive-registry";
import * as ss58 from "@subsquid/ss58";
import { SubstrateBatchProcessor, Block, DataHandlerContext, SubstrateBatchProcessorFields } from "@subsquid/substrate-processor";
import { Store, TypeormDatabase } from "@subsquid/typeorm-store";
import { In } from "typeorm";
import { Core, Staker } from "./model";
import { stakerClaimed as OcifStakingStakerClaimedEvent, coreClaimed as OcifStakingCoreClaimedEvent } from "./types/ocif-staking/events";
import { events, storage } from './types';
import { EntityManager } from 'typeorm';
import assert from "assert";
import { hexToU8a } from '@polkadot/util';
import { Bytes } from '@subsquid/substrate-runtime';
import { BigNumber } from "bignumber.js";


const processor = new SubstrateBatchProcessor()
  .setDataSource({
    archive: lookupArchive("invarch-tinkernet", { release: "ArrowSquid" }),
    chain: {
      url: 'https://tinkernet-rpc.dwellir.com',
      rateLimit: 10
    }
  })
  .setBlockRange({ from: 1_402_932 })
  .addEvent({
    name: ['OcifStaking.StakerClaimed'],
    call: true,
    extrinsic: true
  })
  .addEvent({
    name: ['OcifStaking.CoreClaimed'],
    call: true,
    extrinsic: true
  })
  .addEvent({
    name: ['OcifStaking.NewEra'],
    call: true,
    extrinsic: true
  })
  .setFields({
    event: {
      args: true
    }
  });

type Item = SubstrateBatchProcessorFields<typeof processor>;
type Ctx = DataHandlerContext<Store, Item>;


processor.run(new TypeormDatabase(), async ctx => {
  await checkNewEra(ctx);

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

  for (let c of output) {
    let { typ, id, blockNumber, account, total, coreId } = c;

    if (typ == "staker") {
      let stkr = await ctx.store.findOneBy(Staker, { account });

      const totalRewards = stkr ? stkr.totalRewards + total : total;
      const totalUnclaimed = stkr ? stkr.totalUnclaimed - total : BigInt(0);

      await ctx.store.save(new Staker({
        id, latestClaimBlock: blockNumber, account, totalRewards, totalUnclaimed
      }));
    }
    else {
      let cor = await ctx.store.findOneBy(Core, { coreId });

      const totalRewards = cor ? cor.totalRewards + total : total;
      const totalUnclaimed = cor ? cor.totalUnclaimed - total : BigInt(0);

      await ctx.store.save(new Core({
        id, latestClaimBlock: blockNumber, coreId, totalRewards, totalUnclaimed
      }));
    }
  }
});

async function checkNewEra(ctx: Ctx) {
  for (let block of ctx.blocks) {
    for (let item of block.events) {
      if (item.name == "OcifStaking.NewEra") {
        let data: { era: number; };
        // Check if the event is of version 15
        if (events.ocifStaking.newEra.v15.is(item)) {
          // Decode era data from the event
          let { era } = events.ocifStaking.newEra.v15.decode(item);
          data = { era };
        } else {
          // Throw an error if the event is not of version 15
          throw new Error('Unsupported spec');
        }

        const [prevEraInfo, ledgerInfo, coreEraStakeInfoKeys] = await Promise.all([
          storage.ocifStaking.generalEraInfo.v15.get(block.header, data.era - 1),
          storage.ocifStaking.ledger.v15.getPairs(block.header),
          storage.ocifStaking.coreEraStake.v15.getKeys(block.header)
        ]);

        // Make an array of [core, era] where core doesn't repeat and era is always (data.era - 1)
        // If a more efficient way to do this exists, please refactor.
        const coresWithEra: [number, number][] = [...new Set(coreEraStakeInfoKeys.map(([core, _]) => core))].map((core) => [core, data.era - 1]);

        const coreEraStakeInfo = await storage.ocifStaking.coreEraStake.v15.getMany(block.header, coresWithEra);

        // Check if the previous era and ledgers exist
        if (prevEraInfo && ledgerInfo) {
          const totalStaked = prevEraInfo.staked;
          const stakerRewards = prevEraInfo.rewards.stakers;

          // Map the ledgers to promises
          const mappedLedgers = ledgerInfo.map(([acc, ledger]) => new Promise((resolve) => {
            const account = ss58.codec(117).encode(hexToU8a(acc));

            // Find the staker by account
            ctx.store.findOneBy(Staker, { account }).then((stkr) => {
              // Check if the ledger is locked
              if (ledger && ledger.locked > BigInt(0)) {

                // Calculate the stake for this era
                const thisStake = ledger.locked - ledger.unbondingInfo?.unlockingChunks?.reduce((partialSum, a) => partialSum + a.amount, BigInt(0));

                // Check if the stake is greater than 0
                if (thisStake > 0) {

                  // Calculate the reward for this stake
                  const thisReward = new BigNumber(stakerRewards.toString())
                    .div(new BigNumber(totalStaked.toString()))
                    .times(new BigNumber(thisStake.toString()));

                  // Add the reward to the total unclaimed rewards
                  const totalUnclaimed = (stkr?.totalUnclaimed || BigInt(0)) + BigInt(thisReward.integerValue(BigNumber.ROUND_DOWN).toString());


                  // Save the updated staker to the store
                  ctx.store.save(new Staker({
                    id: account,
                    latestClaimBlock: stkr?.latestClaimBlock || 0,
                    account,
                    totalRewards: stkr?.totalRewards || BigInt(0),
                    totalUnclaimed
                  })).then(() => { });
                }
              }

              resolve({});
            });
          }));

          // Wait for all promises to resolve
          await Promise.all(mappedLedgers);
        }

        // Check if the previous era and core era stake info exist
        if (prevEraInfo && coreEraStakeInfo) {
          const coreRewards = prevEraInfo.rewards.core;
          const totalActiveStake = prevEraInfo.activeStake;

          const mappedCoreEraStakeInfo = coresWithEra.map(([coreId, _], i) => {
            const coreStakeInfo = coreEraStakeInfo[i];

            return new Promise((resolve) => {
              // Find the core by id
              ctx.store.findOneBy(Core, { coreId }).then((cor) => {

                // Check if core is active and rewards weren't claimed
                if (coreStakeInfo?.active && !coreStakeInfo.rewardClaimed) {

                  // Calculate the reward for this core's stake
                  const thisReward = new BigNumber(coreRewards.toString())
                    .div(new BigNumber(totalActiveStake.toString()))
                    .times(new BigNumber(coreStakeInfo.total.toString()));

                  // Add the reward to the total unclaimed rewards
                  const totalUnclaimed = (cor?.totalUnclaimed || BigInt(0)) + BigInt(thisReward.integerValue(BigNumber.ROUND_DOWN).toString());

                  // Save the updated core to the store
                  ctx.store.save(new Core({
                    id: coreId.toString(),
                    latestClaimBlock: cor?.latestClaimBlock || 0,
                    coreId,
                    totalRewards: cor?.totalRewards || BigInt(0),
                    totalUnclaimed
                  })).then(() => { });
                }

                resolve({});
              });
            });
          });

          // Wait for all promises to resolve
          await Promise.all(mappedCoreEraStakeInfo);
        }
      }
    }
  }
}

interface ClaimEvent {
  typ: string;
  id: string;
  blockNumber: number;
  account: string;
  total: bigint,
  coreId: number,
}

async function getClaims(ctx: Ctx): Promise<ClaimEvent[]> {
  let claims: ClaimEvent[] = [];

  for (let block of ctx.blocks) {
    for (let item of block.events) {
      if (item.name == "OcifStaking.StakerClaimed") {

        let data: { staker: string, core: number, era: number, amount: bigint; };
        if (events.ocifStaking.stakerClaimed.v15.is(item)) {
          let { staker, core, era, amount } = events.ocifStaking.stakerClaimed.v15.decode(item);
          data = { staker, core, era, amount };
        } else {
          throw new Error('Unsupported spec');
        }

        claims.push({
          typ: "staker",
          id: ss58.codec(117).encode(hexToU8a(data.staker)),
          blockNumber: block.header.height,
          account: ss58.codec(117).encode(hexToU8a(data.staker)),
          total: data.amount,
          coreId: data.core
        });
      } else if (item.name == "OcifStaking.CoreClaimed") {

        let data: { core: number, destinationAccount: string, era: number, amount: bigint; };
        if (events.ocifStaking.coreClaimed.v15.is(item)) {
          let { core, destinationAccount, era, amount } = events.ocifStaking.coreClaimed.v15.decode(item);
          data = { core, destinationAccount, era, amount };
        } else {
          throw new Error('Unsupported spec');
        }

        claims.push({
          typ: "core",
          id: data.core.toString(),
          blockNumber: block.header.height,
          account: ss58.codec(117).encode(hexToU8a(data.destinationAccount)),
          total: data.amount,
          coreId: data.core
        });
      }
    }
  }
  return claims;
}
