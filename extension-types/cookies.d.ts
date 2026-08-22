import type { Store, StoreBase } from "store2";

declare module "store2" {
  interface Store {
    cookies: StoreBase;
  }
}

/** Side-effect import: all-cookies storage area at `store.cookies`. */
export {};
