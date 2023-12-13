import {sts, Result, Option, Bytes, BitSequence} from './support'

export interface EraInfo {
    rewards: RewardInfo
    staked: bigint
    activeStake: bigint
    locked: bigint
}

export interface RewardInfo {
    stakers: bigint
    core: bigint
}

export const EraInfo: sts.Type<EraInfo> = sts.struct(() => {
    return  {
        rewards: RewardInfo,
        staked: sts.bigint(),
        activeStake: sts.bigint(),
        locked: sts.bigint(),
    }
})

export const RewardInfo: sts.Type<RewardInfo> = sts.struct(() => {
    return  {
        stakers: sts.bigint(),
        core: sts.bigint(),
    }
})

export type AccountId32 = Bytes

export interface AccountLedger {
    locked: bigint
    unbondingInfo: UnbondingInfo
}

export interface UnbondingInfo {
    unlockingChunks: UnlockingChunk[]
}

export interface UnlockingChunk {
    amount: bigint
    unlockEra: number
}

export const AccountLedger: sts.Type<AccountLedger> = sts.struct(() => {
    return  {
        locked: sts.bigint(),
        unbondingInfo: UnbondingInfo,
    }
})

export const UnbondingInfo: sts.Type<UnbondingInfo> = sts.struct(() => {
    return  {
        unlockingChunks: sts.array(() => UnlockingChunk),
    }
})

export const UnlockingChunk: sts.Type<UnlockingChunk> = sts.struct(() => {
    return  {
        amount: sts.bigint(),
        unlockEra: sts.number(),
    }
})

export const AccountId32 = sts.bytes()
