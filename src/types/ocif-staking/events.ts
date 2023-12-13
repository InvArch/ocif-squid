import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v15 from '../v15'

export const newEra =  {
    name: 'OcifStaking.NewEra',
    v15: new EventType(
        'OcifStaking.NewEra',
        sts.struct({
            era: sts.number(),
        })
    ),
}

export const stakerClaimed =  {
    name: 'OcifStaking.StakerClaimed',
    v15: new EventType(
        'OcifStaking.StakerClaimed',
        sts.struct({
            staker: v15.AccountId32,
            core: sts.number(),
            era: sts.number(),
            amount: sts.bigint(),
        })
    ),
}

export const coreClaimed =  {
    name: 'OcifStaking.CoreClaimed',
    v15: new EventType(
        'OcifStaking.CoreClaimed',
        sts.struct({
            core: sts.number(),
            destinationAccount: v15.AccountId32,
            era: sts.number(),
            amount: sts.bigint(),
        })
    ),
}
