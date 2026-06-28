import type { Store, StoreBase } from "store2";

/** Store with dynamic property access for stored keys. */
export type ProxyStore = Store & Record<string, unknown>;

declare module "store2" {
  interface DeveloperTools {
    wrapStore(target: StoreBase): Store;
    wrapData(store: StoreBase, key: string, value: unknown): unknown;
  }
}

/** Default export: proxied store with automatic property access. */
declare const store: ProxyStore;
export default store;
