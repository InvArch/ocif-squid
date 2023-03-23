import assert from 'assert'
import {Chain, ChainContext, EventContext, Event, Result, Option} from './support'

export class OcifStakingCoreClaimedEvent {
    private readonly _chain: Chain
    private readonly event: Event

    constructor(ctx: EventContext)
    constructor(ctx: ChainContext, event: Event)
    constructor(ctx: EventContext, event?: Event) {
        event = event || ctx.event
        assert(event.name === 'OcifStaking.CoreClaimed')
        this._chain = ctx._chain
        this.event = event
    }

    get isV15(): boolean {
        return this._chain.getEventHash('OcifStaking.CoreClaimed') === 'b04d265e0fd88c43c9ce0abbb0dae9f0e894c8306c52814ce7f0ebbb3c10179c'
    }

    get asV15(): {core: number, destinationAccount: Uint8Array, era: number, amount: bigint} {
        assert(this.isV15)
        return this._chain.decodeEvent(this.event)
    }
}

export class OcifStakingStakerClaimedEvent {
    private readonly _chain: Chain
    private readonly event: Event

    constructor(ctx: EventContext)
    constructor(ctx: ChainContext, event: Event)
    constructor(ctx: EventContext, event?: Event) {
        event = event || ctx.event
        assert(event.name === 'OcifStaking.StakerClaimed')
        this._chain = ctx._chain
        this.event = event
    }

    get isV15(): boolean {
        return this._chain.getEventHash('OcifStaking.StakerClaimed') === '21b8240432b8d175bad8933e556512d52ff06cae04f1b9ac688621a500f1b310'
    }

    get asV15(): {staker: Uint8Array, core: number, era: number, amount: bigint} {
        assert(this.isV15)
        return this._chain.decodeEvent(this.event)
    }
}
