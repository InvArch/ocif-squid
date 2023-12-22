import { sts, Result, Option, Bytes, BitSequence } from './support';

export type AccountId32 = Bytes;

export interface AccountLedger {
  locked: bigint;
  unbondingInfo: UnbondingInfo;
}

export interface UnbondingInfo {
  unlockingChunks: UnlockingChunk[];
}

export interface UnlockingChunk {
  amount: bigint;
  unlockEra: number;
}

export interface EraInfo {
  rewards: RewardInfo;
  staked: bigint;
  activeStake: bigint;
  locked: bigint;
}

export interface RewardInfo {
  stakers: bigint;
  core: bigint;
}

export interface CoreMetadata {
  name: string;
  description: string;
  image: string;
}

export interface CoreInfo {
  metadata: CoreMetadata;
}

export interface CoreEraStakeInfo {
  total: bigint;
  numberOfStakers: bigint;
  rewardClaimed: boolean;
  active: boolean;
}

export const CoreEraStakeInfo: sts.Type<CoreEraStakeInfo> = sts.struct(() => {
  return {
    total: sts.bigint(),
    numberOfStakers: sts.bigint(),
    rewardClaimed: sts.boolean(),
    active: sts.boolean(),
  };
});

export const CoreInfo: sts.Type<CoreInfo> = sts.struct(() => {
  return {
    metadata: CoreMetadata,
  };
});

export const CoreMetadata: sts.Type<CoreMetadata> = sts.struct(() => {
  return {
    name: sts.string(),
    description: sts.string(),
    image: sts.string(),
  };
});

export const EraInfo: sts.Type<EraInfo> = sts.struct(() => {
  return {
    rewards: RewardInfo,
    staked: sts.bigint(),
    activeStake: sts.bigint(),
    locked: sts.bigint(),
  };
});

export const RewardInfo: sts.Type<RewardInfo> = sts.struct(() => {
  return {
    stakers: sts.bigint(),
    core: sts.bigint(),
  };
});

export const AccountLedger: sts.Type<AccountLedger> = sts.struct(() => {
  return {
    locked: sts.bigint(),
    unbondingInfo: UnbondingInfo,
  };
});

export const UnbondingInfo: sts.Type<UnbondingInfo> = sts.struct(() => {
  return {
    unlockingChunks: sts.array(() => UnlockingChunk),
  };
});

export const UnlockingChunk: sts.Type<UnlockingChunk> = sts.struct(() => {
  return {
    amount: sts.bigint(),
    unlockEra: sts.number(),
  };
});

export const AccountId32 = sts.bytes();
