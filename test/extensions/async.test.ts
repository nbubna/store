import { store } from "../setup";
import "../../src/extensions/async";
import { beforeEach, describe, expect, it } from "vitest";

describe("async extension", () => {
  beforeEach(() => {
    store.clearAll();
  });

  it("promisifies get and set", async () => {
    await store.async.set("async-key", "value");
    await expect(store.async.get("async-key")).resolves.toBe("value");
  });

  it("promisifies remove and has", async () => {
    store.set("gone", true);
    await expect(store.async.has("gone")).resolves.toBe(true);
    await store.async.remove("gone");
    await expect(store.async.get("gone")).resolves.toBeNull();
  });

  it("marks async apis and reuses the same instance", () => {
    expect(store.async._async).toBe(true);
    expect(store.session.async._async).toBe(true);
    const again = store.async;
    expect(again._async).toBe(true);
  });

  it("promisifies session storage", async () => {
    await store.session.async.set("item", 42);
    await expect(store.session.async.get("item")).resolves.toBe(42);
  });

  it("does not promisify area, namespace, or isFake", () => {
    expect(typeof store.async.area).toBe("function");
    expect(typeof store.async.namespace).toBe("function");
    expect(typeof store.async.isFake).toBe("function");
    expect(store.async.area("async-area")).not.toBeInstanceOf(Promise);
  });

  it("exposes promisify on developer tools", () => {
    expect(typeof store._.promisify).toBe("function");
    expect(typeof store._.promiseFn).toBe("function");
  });

  it("rejects when the underlying sync method throws", async () => {
    const failing = store._.promiseFn(
      "set",
      () => {
        throw new Error("sync failed");
      },
      store,
    );
    await expect(failing("bad", "value")).rejects.toThrow("sync failed");
  });

  it("lazy-promisifies via the storeAPI async getter", () => {
    const storeAPI = store._.storeAPI;
    // oxlint-disable-next-line typescript/unbound-method
    const getter = Object.getOwnPropertyDescriptor(storeAPI, "async")?.get;
    const api = Object.assign(function () {}, {
      _id: "getter-test",
      _area: store._area,
      _ns: "getter.",
      get: (key: string, alt?: unknown) => store.get(key, alt),
      set: (key: string, data: unknown, overwrite?: boolean) =>
        store.set(key, data, overwrite),
    });
    getter!.call(api);
    expect(api.async._async).toBe(true);
  });
});
