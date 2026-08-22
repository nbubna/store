import type { DeveloperTools, StoreAPI } from "store2";

declare module "store2" {
  interface DeveloperTools {
    expires(s: string): number | false;
    when(sec?: number): number | Date;
    cache(area: Storage, key: string): string | null | undefined;
  }

  interface StoreAPI {
    set<T = unknown>(key: string, data: T, overwrite?: boolean | number): T | null;
  }
}

/** Side-effect import: TTL expiration via numeric `overwrite` on set. */
export {};
