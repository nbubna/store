import type { Store, StoreBase } from "store2";

declare module "store2" {
  interface Store {
    cookie: StoreBase;
  }
}

/** Side-effect import: cookie-backed storage area at `store.cookie`. */
export {};
