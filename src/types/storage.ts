import assert from 'assert'
import {Block, BlockContext, Chain, ChainContext, Option, Result, StorageBase} from './support'
import * as v14 from './v14'

export class OcifStakingCurrentEraStorage extends StorageBase {
    protected getPrefix() {
        return 'OcifStaking'
    }

    protected getName() {
        return 'CurrentEra'
    }

    get isV14(): boolean {
        return this.getTypeHash() === '81bbbe8e62451cbcc227306706c919527aa2538970bd6d67a9969dd52c257d02'
    }

    get asV14(): OcifStakingCurrentEraStorageV14 {
        assert(this.isV14)
        return this as any
    }
}

export interface OcifStakingCurrentEraStorageV14 {
    get(): Promise<number>
}

export class OcifStakingGeneralEraInfoStorage extends StorageBase {
    protected getPrefix() {
        return 'OcifStaking'
    }

    protected getName() {
        return 'GeneralEraInfo'
    }

    get isV14(): boolean {
        return this.getTypeHash() === '7d5bf62e53399dbffffdac4f26445e03e68540cad34c525320940cd8e40836c2'
    }

    get asV14(): OcifStakingGeneralEraInfoStorageV14 {
        assert(this.isV14)
        return this as any
    }
}

export interface OcifStakingGeneralEraInfoStorageV14 {
    get(key: number): Promise<(v14.EraInfo | undefined)>
    getAll(): Promise<v14.EraInfo[]>
    getMany(keys: number[]): Promise<(v14.EraInfo | undefined)[]>
    getKeys(): Promise<number[]>
    getKeys(key: number): Promise<number[]>
    getKeysPaged(pageSize: number): AsyncIterable<number[]>
    getKeysPaged(pageSize: number, key: number): AsyncIterable<number[]>
    getPairs(): Promise<[k: number, v: v14.EraInfo][]>
    getPairs(key: number): Promise<[k: number, v: v14.EraInfo][]>
    getPairsPaged(pageSize: number): AsyncIterable<[k: number, v: v14.EraInfo][]>
    getPairsPaged(pageSize: number, key: number): AsyncIterable<[k: number, v: v14.EraInfo][]>
}

export class OcifStakingGeneralStakerInfoStorage extends StorageBase {
    protected getPrefix() {
        return 'OcifStaking'
    }

    protected getName() {
        return 'GeneralStakerInfo'
    }

    get isV14(): boolean {
        return this.getTypeHash() === '576bde86822c8f0999676ed77307eaf8637935dcee0d6888acf3d3881cce8f71'
    }

    get asV14(): OcifStakingGeneralStakerInfoStorageV14 {
        assert(this.isV14)
        return this as any
    }
}

export interface OcifStakingGeneralStakerInfoStorageV14 {
    get(key1: number, key2: Uint8Array): Promise<v14.StakerInfo>
    getAll(): Promise<v14.StakerInfo[]>
    getMany(keys: [number, Uint8Array][]): Promise<v14.StakerInfo[]>
    getKeys(): Promise<[number, Uint8Array][]>
    getKeys(key1: number): Promise<[number, Uint8Array][]>
    getKeys(key1: number, key2: Uint8Array): Promise<[number, Uint8Array][]>
    getKeysPaged(pageSize: number): AsyncIterable<[number, Uint8Array][]>
    getKeysPaged(pageSize: number, key1: number): AsyncIterable<[number, Uint8Array][]>
    getKeysPaged(pageSize: number, key1: number, key2: Uint8Array): AsyncIterable<[number, Uint8Array][]>
    getPairs(): Promise<[k: [number, Uint8Array], v: v14.StakerInfo][]>
    getPairs(key1: number): Promise<[k: [number, Uint8Array], v: v14.StakerInfo][]>
    getPairs(key1: number, key2: Uint8Array): Promise<[k: [number, Uint8Array], v: v14.StakerInfo][]>
    getPairsPaged(pageSize: number): AsyncIterable<[k: [number, Uint8Array], v: v14.StakerInfo][]>
    getPairsPaged(pageSize: number, key1: number): AsyncIterable<[k: [number, Uint8Array], v: v14.StakerInfo][]>
    getPairsPaged(pageSize: number, key1: number, key2: Uint8Array): AsyncIterable<[k: [number, Uint8Array], v: v14.StakerInfo][]>
}

export class OcifStakingLedgerStorage extends StorageBase {
    protected getPrefix() {
        return 'OcifStaking'
    }

    protected getName() {
        return 'Ledger'
    }

    get isV14(): boolean {
        return this.getTypeHash() === 'ac213556e407abbf63dced551f02de72e90aa6cacfd9ef7ff6881f285d91136d'
    }

    get asV14(): OcifStakingLedgerStorageV14 {
        assert(this.isV14)
        return this as any
    }
}

export interface OcifStakingLedgerStorageV14 {
    get(key: Uint8Array): Promise<v14.AccountLedger>
    getAll(): Promise<v14.AccountLedger[]>
    getMany(keys: Uint8Array[]): Promise<v14.AccountLedger[]>
    getKeys(): Promise<Uint8Array[]>
    getKeys(key: Uint8Array): Promise<Uint8Array[]>
    getKeysPaged(pageSize: number): AsyncIterable<Uint8Array[]>
    getKeysPaged(pageSize: number, key: Uint8Array): AsyncIterable<Uint8Array[]>
    getPairs(): Promise<[k: Uint8Array, v: v14.AccountLedger][]>
    getPairs(key: Uint8Array): Promise<[k: Uint8Array, v: v14.AccountLedger][]>
    getPairsPaged(pageSize: number): AsyncIterable<[k: Uint8Array, v: v14.AccountLedger][]>
    getPairsPaged(pageSize: number, key: Uint8Array): AsyncIterable<[k: Uint8Array, v: v14.AccountLedger][]>
}

export class OcifStakingRegisteredCoreStorage extends StorageBase {
    protected getPrefix() {
        return 'OcifStaking'
    }

    protected getName() {
        return 'RegisteredCore'
    }

    get isV14(): boolean {
        return this.getTypeHash() === '7299029ff3171564d08f0a50e59970efb7de118966377dab1a87eb10a2e9f434'
    }

    get asV14(): OcifStakingRegisteredCoreStorageV14 {
        assert(this.isV14)
        return this as any
    }
}

export interface OcifStakingRegisteredCoreStorageV14 {
    get(key: number): Promise<(v14.CoreInfo | undefined)>
    getAll(): Promise<v14.CoreInfo[]>
    getMany(keys: number[]): Promise<(v14.CoreInfo | undefined)[]>
    getKeys(): Promise<number[]>
    getKeys(key: number): Promise<number[]>
    getKeysPaged(pageSize: number): AsyncIterable<number[]>
    getKeysPaged(pageSize: number, key: number): AsyncIterable<number[]>
    getPairs(): Promise<[k: number, v: v14.CoreInfo][]>
    getPairs(key: number): Promise<[k: number, v: v14.CoreInfo][]>
    getPairsPaged(pageSize: number): AsyncIterable<[k: number, v: v14.CoreInfo][]>
    getPairsPaged(pageSize: number, key: number): AsyncIterable<[k: number, v: v14.CoreInfo][]>
}
