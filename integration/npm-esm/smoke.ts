/**
 * Integration smoke test: consume store2 from npm (file: link) as ESM + TypeScript.
 */
import store from "store2";
import "store2/cache";
import proxyStore from "store2/proxy";
import type { Store } from "store2";

type CacheStore = Store & {
  set<T>(key: string, data: T, overwrite?: boolean | number): T | null;
};

const cacheStore = store as CacheStore;

cacheStore.set("npm-esm", { ok: true });
const payload = cacheStore.get<{ ok: boolean }>("npm-esm");
if (payload?.ok !== true) {
  throw new Error("store2 ESM import failed");
}

cacheStore.set("ttl-key", "value", 60);
if (cacheStore.get("ttl-key") !== "value") {
  throw new Error("store2/cache extension failed");
}

proxyStore.demo = "proxy";
if (proxyStore.get("demo") !== "proxy") {
  throw new Error("store2/proxy default export failed");
}

console.log("npm-esm integration OK");
