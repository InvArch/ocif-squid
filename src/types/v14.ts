import type {Result, Option} from './support'

export interface EraInfo {
    rewards: RewardInfo
    staked: bigint
    activeStake: bigint
    locked: bigint
}

export interface StakerInfo {
    stakes: EraStake[]
}

export interface AccountLedger {
    locked: bigint
    unbondingInfo: UnbondingInfo
}

export interface CoreInfo {
    account: Uint8Array
    metadata: CoreMetadata
}

export interface RewardInfo {
    stakers: bigint
    core: bigint
}

export interface EraStake {
    staked: bigint
    era: number
}

export interface UnbondingInfo {
    unlockingChunks: UnlockingChunk[]
}

export interface CoreMetadata {
    name: Uint8Array
    description: Uint8Array
    image: Uint8Array
}

export interface UnlockingChunk {
    amount: bigint
    unlockEra: number
}
