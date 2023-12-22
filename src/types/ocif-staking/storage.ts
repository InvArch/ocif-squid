import { sts, Block, Bytes, Option, Result, StorageType, RuntimeCtx } from '../support';
import * as v15 from '../v15';

export const ledger = {
  v15: new StorageType('OcifStaking.Ledger', 'Default', [v15.AccountId32], v15.AccountLedger) as LedgerV15,
};

export interface LedgerV15 {
  is(block: RuntimeCtx): boolean;
  getDefault(block: Block): v15.AccountLedger;
  get(block: Block, key: v15.AccountId32): Promise<(v15.AccountLedger | undefined)>;
  getMany(block: Block, keys: v15.AccountId32[]): Promise<(v15.AccountLedger | undefined)[]>;
  getKeys(block: Block): Promise<v15.AccountId32[]>;
  getKeys(block: Block, key: v15.AccountId32): Promise<v15.AccountId32[]>;
  getKeysPaged(pageSize: number, block: Block): AsyncIterable<v15.AccountId32[]>;
  getKeysPaged(pageSize: number, block: Block, key: v15.AccountId32): AsyncIterable<v15.AccountId32[]>;
  getPairs(block: Block): Promise<[k: v15.AccountId32, v: (v15.AccountLedger | undefined)][]>;
  getPairs(block: Block, key: v15.AccountId32): Promise<[k: v15.AccountId32, v: (v15.AccountLedger | undefined)][]>;
  getPairsPaged(pageSize: number, block: Block): AsyncIterable<[k: v15.AccountId32, v: (v15.AccountLedger | undefined)][]>;
  getPairsPaged(pageSize: number, block: Block, key: v15.AccountId32): AsyncIterable<[k: v15.AccountId32, v: (v15.AccountLedger | undefined)][]>;
}

export const generalEraInfo = {
  v15: new StorageType('OcifStaking.GeneralEraInfo', 'Optional', [sts.number()], v15.EraInfo) as GeneralEraInfoV15,
};

export interface GeneralEraInfoV15 {
  is(block: RuntimeCtx): boolean;
  get(block: Block, key: number): Promise<(v15.EraInfo | undefined)>;
  getMany(block: Block, keys: number[]): Promise<(v15.EraInfo | undefined)[]>;
  getKeys(block: Block): Promise<number[]>;
  getKeys(block: Block, key: number): Promise<number[]>;
  getKeysPaged(pageSize: number, block: Block): AsyncIterable<number[]>;
  getKeysPaged(pageSize: number, block: Block, key: number): AsyncIterable<number[]>;
  getPairs(block: Block): Promise<[k: number, v: (v15.EraInfo | undefined)][]>;
  getPairs(block: Block, key: number): Promise<[k: number, v: (v15.EraInfo | undefined)][]>;
  getPairsPaged(pageSize: number, block: Block): AsyncIterable<[k: number, v: (v15.EraInfo | undefined)][]>;
  getPairsPaged(pageSize: number, block: Block, key: number): AsyncIterable<[k: number, v: (v15.EraInfo | undefined)][]>;
}

export const registeredCore = {
  v15: new StorageType('OcifStaking.RegisteredCore', 'Optional', [sts.number()], v15.CoreInfo) as RegisteredCoreV15,
};

export interface RegisteredCoreV15 {
  is(block: RuntimeCtx): boolean;
  get(block: Block, key: number): Promise<(v15.CoreInfo | undefined)[]>;
  getKeys(block: Block): Promise<number[]>;
  getKeysPaged(pageSize: number, block: Block): AsyncIterable<number[]>;
  getPairs(block: Block): Promise<[k: number, v: (v15.CoreInfo | undefined)][]>;
  getPairs(block: Block, key: number): Promise<[k: number, v: (v15.CoreInfo | undefined)][]>;
  getPairsPaged(pageSize: number, block: Block, key: number): AsyncIterable<[k: number, v: (v15.CoreInfo | undefined)][]>;
}

export const coreEraStake = {
  v15: new StorageType('OcifStaking.CoreEraStake', 'Default', [sts.number(), sts.number()], v15.CoreEraStakeInfo) as CoreEraStakeV15,
};

export interface CoreEraStakeV15 {
  is(block: RuntimeCtx): boolean;
  get(block: Block, key: number[]): Promise<(v15.CoreEraStakeInfo | undefined)[]>;
  getPairs(block: Block): Promise<[k: number[], v: (v15.CoreEraStakeInfo | undefined)][]>;
  getPairs(block: Block, key: number[]): Promise<[k: number[], v: (v15.CoreEraStakeInfo | undefined)][]>;
}