import type { FakeStorage, FakeStorageCore, Replacer, Reviver, StorageAPI, StorageLike, StoreAPI, StoreBase } from "./types";

/** Shared methods on fake storage; `items` / `name` exist only on instances from `storage()`. */

export interface StoreAPIInternal extends StoreAPI {
  _id: string;
  _area: StorageLike;
  _ns: string;
  _delim?: string;
  _real?: StorageLike;
  _async?: boolean;
  _in(k: string | unknown): string;
  _out(k: string | null | undefined): string | undefined;
  [key: string]: unknown;
}

export interface InternalSupport {
  version: string;
  areas: Record<string, StorageLike>;
  apis: Record<string, StoreAPIInternal>;
  nsdelim: string;
  revive?: Reviver;
  replace?: Replacer;
  conflict?: unknown;
  storeAPI: StoreAPIInternal;
  storageAPI: StorageAPI;
  inherit<S = StorageAPI | StoreAPIInternal, O = StoreBase | FakeStorageCore>(
    api: S,
    o: O,
  ): S & O;
  stringify<T = unknown>(d: unknown, fn?: Replacer<T>): string;
  parse<T = unknown>(s: string, fn?: Reviver<T>): T | unknown;
  fn(name: string, fn: (...args: unknown[]) => unknown): void;
  get(area: StorageLike, key: string): string | null;
  set(area: StorageLike, key: string, value: string, overwrite?: unknown): unknown;
  remove(area: StorageLike, key: string): void;
  key(area: StorageLike, i: number): string | null | undefined;
  length(area: StorageLike): number;
  clear(area: StorageLike): void;
  Store(id: string, area: StorageLike | undefined, namespace?: string): StoreAPIInternal;
  storage(name: string): FakeStorage;
  [key: string]: unknown;
}

export type { StoreAPI };
