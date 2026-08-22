import type { StoreAPI } from "store2";

declare module "store2" {
  interface StoreAPI {
    /** Supports dotted paths, e.g. `get('foo.bar.baz')`. */
    get<T = unknown>(key: string): T | null;
    get<T = unknown>(key: string, alt?: T): T | null;
  }
}

/** Side-effect import: nested property access in get keys. */
export {};
