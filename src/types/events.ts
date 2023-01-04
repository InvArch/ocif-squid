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

    get isV14(): boolean {
        return this._chain.getEventHash('OcifStaking.CoreClaimed') === 'b04d265e0fd88c43c9ce0abbb0dae9f0e894c8306c52814ce7f0ebbb3c10179c'
    }

    get asV14(): {core: number, destinationAccount: Uint8Array, era: number, amount: bigint} {
        assert(this.isV14)
        return this._chain.decodeEvent(this.event)
    }
}

export class OcifStakingNewEraEvent {
    private readonly _chain: Chain
    private readonly event: Event

    constructor(ctx: EventContext)
    constructor(ctx: ChainContext, event: Event)
    constructor(ctx: EventContext, event?: Event) {
        event = event || ctx.event
        assert(event.name === 'OcifStaking.NewEra')
        this._chain = ctx._chain
        this.event = event
    }

    get isV14(): boolean {
        return this._chain.getEventHash('OcifStaking.NewEra') === '39115a13c53f2b1968fdc266219c33cc8b971dddad3e2b3c0f3848136e2368b7'
    }

    get asV14(): {era: number} {
        assert(this.isV14)
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

    get isV14(): boolean {
        return this._chain.getEventHash('OcifStaking.StakerClaimed') === '21b8240432b8d175bad8933e556512d52ff06cae04f1b9ac688621a500f1b310'
    }

    get asV14(): {staker: Uint8Array, core: number, era: number, amount: bigint} {
        assert(this.isV14)
        return this._chain.decodeEvent(this.event)
    }
}
