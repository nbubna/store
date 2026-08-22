import type { StoreAPI, StoreBase } from "store2";

declare module "store2" {
  interface StoreAPI {
    dot(key: string): StoreBase;
    dot(...keys: string[]): StoreBase;
  }
}

/** Side-effect import: property accessors for stored keys. */
export {};
