export interface StoredData {
  [key: string]: unknown;
}

export type Replacer<T = unknown> = (key: string, value: T) => string | String[] | number[] | T;
export type Reviver<T = unknown> = (key: string, value: T) => T;
export type EachFn<T = unknown> = (key: string, data: T, fill?: T) => false | T | void;
export type TransactFn<T = unknown> = (data: T | null) => T | null;
export type ExtensionFn<A = unknown, B extends StoreBase = StoreBase, R = unknown> = (
  this: B,
  ...args: A[]
) => R | null;

// Base override signaturess for Store
type Set = <T = unknown>(key: string, data: T) => T | null;
type Get = <T = unknown>(key: string) => T | null;
type SetAll = (obj: StoredData) => StoredData;
type GetAll = () => StoredData;
type Transact = <T = unknown>(key: string, fn: TransactFn, alt?: T) => StoreBase;
type Each = <T = unknown>(fn: EachFn<T>) => StoreBase;
type Clear = (clear: false) => StoreBase;

export type StoreFn = Set & Get & SetAll & GetAll & Transact & Each & Clear;

export interface StoreAPI {
  clear(): StoreBase;
  clearAll(): StoreBase;
  each<T = unknown>(callback: EachFn<T>, fill?: T): StoreBase;
  get<T = unknown>(key: string): T | null;
  get<T = unknown>(key: string, alt?: T | Reviver<T>): T | null;
  getAll<S extends StoredData = StoredData>(fillObj?: S): S;
  has(key: string): boolean;
  isFake(force?: boolean): boolean;
  keys(fillList?: string[]): string[];
  namespace(namespace: string, singleArea?: true, delim?: string): Store;
  namespace(): string;
  remove<T = unknown>(key: string, alt?: T | Reviver<T>): T | null;
  set<T = unknown>(key: string, data: T, overwrite?: boolean | Replacer<T>): T | null;
  set<T = unknown>(key: string, data: T, overwrite?: boolean | Replacer<T>): T | null;
  setAll<T = unknown>(data: StoredData, overwrite?: boolean | Replacer<T>): boolean | undefined;
  add<T = unknown>(key: string, data: T, replacer?: Replacer<T>): T | null;
  size(): number;
  transact<T = unknown>(key: string, fn: TransactFn<T>, alt?: T | Reviver<T>): StoreBase;
  area(id: string, area?: StorageLike): StoreBase;
  toString(): string;
}

export type StoreBase = StoreAPI & StoreFn;

export interface DeveloperTools {
  readonly version: string;
  readonly areas: Record<string, Storage>;
  readonly apis: Record<string, StoreAPI>;
  nsdelim: string;
  revive?: Reviver;
  replace?: Replacer;
  conflict?: unknown;
  readonly fn: (name: string, fn: ExtensionFn) => void;
  storeAPI: StoreAPI;
  storageAPI: Record<string, unknown>;
  get: (area: Storage, key: string) => string | null;
  set: (area: Storage, key: string, string: string, overwrite?: unknown) => void;
  remove: (area: Storage, key: string) => void;
  key: (area: Storage, i: number) => string | null | undefined;
  length: (area: Storage) => number;
  clear: (area: Storage) => void;
  parse: (s: string, fn?: Reviver) => unknown;
  stringify: (d: unknown, fn?: Replacer) => string;
  inherit: (api: object, o: object) => StoreBase;
  Store: (id: string, area: Storage | undefined, namespace?: string) => StoreBase;
  storage: (name: string) => Storage & { name: string; items: Record<string, string> };
  [key: string]: unknown;
}

export interface StorageAPI {
  length: number;
  has(k: string): boolean;
  key(i: number): string | undefined;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
  getItem(k: string): string | null;
  clear(): void;
}

export interface FakeStorageCore {
  name: string;
  items: Record<string, string>;
}

export interface FakeStorage extends StorageAPI, FakeStorageCore {}

export type StorageLike = Storage | FakeStorage;

export interface StoreMetadata {
  readonly _: DeveloperTools;
  _area: StorageLike;
  _id: string;
  _ns: string;
  _delim?: string;
  _real?: StorageLike;
  _async?: boolean;
}

export type Store = StoreBase & {
  local: StoreBase;
  session: StoreBase;
  page: StoreBase;
} & StoreMetadata;
