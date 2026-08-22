import type { StoreAPI, StoreBase } from "store2";
import type { StorageEventDetail } from "./on.d.ts";

declare module "store2" {
  interface StoreAPI {
    on(key: string, fn: (event: StorageEventDetail) => unknown): StoreBase;
    on(fn: (event: StorageEventDetail) => unknown): StoreBase;
    off(key: string, fn: (event: StorageEventDetail) => unknown): StoreBase;
    off(fn: (event: StorageEventDetail) => unknown): StoreBase;
  }
}

/** Side-effect import: alternate storage event binding (bind variant). */
export {};
