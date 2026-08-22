import type { StoreAPI } from "store2";

declare module "store2" {
  interface StoreAPI {
    readonly async: StoreAPI & { _async?: true };
  }
}

/** Side-effect import: adds a promise-based `async` duplicate on each store API. */
export {};
