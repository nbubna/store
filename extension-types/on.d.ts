import type { DeveloperTools, StoreAPI, StoreBase } from "store2";

export interface StorageEventDetail {
  key: string;
  namespace: string;
  newValue: unknown;
  oldValue: unknown;
  url?: string;
  storageArea?: Storage;
  source?: unknown;
  timeStamp?: number;
  originalEvent?: StorageEvent;
  expires?: Date | number;
}

declare module "store2" {
  interface StoreAPI {
    on(key: string, fn: (event: StorageEventDetail) => unknown): StoreBase;
    on(fn: (event: StorageEventDetail) => unknown): StoreBase;
    off(key: string, fn: (event: StorageEventDetail) => unknown): StoreBase;
    off(fn: (event: StorageEventDetail) => unknown): StoreBase;
    once(key: string, fn: (event: StorageEventDetail) => unknown): StoreBase;
    once(fn: (event: StorageEventDetail) => unknown): StoreBase;
  }

  interface DeveloperTools {
    event(k: string, e: StorageEvent): StorageEventDetail;
  }
}

/** Side-effect import: enhanced storage event handling. */
export {};
