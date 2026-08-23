import { store } from "../setup";
import "../../src/extensions/on";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("on extension", () => {
  beforeEach(() => {
    store.clearAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers on, off, and once handlers", () => {
    expect(typeof store.on).toBe("function");
    expect(typeof store.off).toBe("function");
    expect(typeof store.once).toBe("function");
  });

  it("delivers parsed storage events for a specific key", () => {
    const events: Array<{ key: string; newValue: unknown; oldValue: unknown }> = [];
    const listener = (e: { key: string; newValue: unknown; oldValue: unknown }) => {
      events.push({ key: e.key, newValue: e.newValue, oldValue: e.oldValue });
    };

    store.on("foo", listener);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "foo",
        oldValue: JSON.stringify(1),
        newValue: JSON.stringify(2),
        storageArea: localStorage,
      }),
    );
    store.off("foo", listener);

    expect(events).toEqual([{ key: "foo", oldValue: 1, newValue: 2 }]);
  });

  it("filters by namespace and ignores internal test keys", () => {
    const ns = store.namespace("events");
    const received: Array<{ key: string; namespace: string }> = [];
    ns.on("foo", (e: { key: string; namespace: string }) =>
      received.push({ key: e.key, namespace: e.namespace }),
    );

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "events.foo",
        newValue: JSON.stringify({ a: 1 }),
        storageArea: localStorage,
      }),
    );
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "_-bad-_",
        newValue: JSON.stringify("nope"),
        storageArea: localStorage,
      }),
    );

    expect(received).toEqual([{ key: "foo", namespace: "events" }]);
    ns.clear();
  });

  it("runs once listeners only one time", () => {
    let count = 0;
    const listener = () => {
      count++;
    };
    store.once("once-key", listener);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "once-key",
        newValue: JSON.stringify(1),
        storageArea: localStorage,
      }),
    );
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "once-key",
        newValue: JSON.stringify(2),
        storageArea: localStorage,
      }),
    );

    expect(count).toBe(1);
  });

  it("supports listener-only once overload", () => {
    let count = 0;
    store.once(() => {
      count++;
    });
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "any",
        newValue: JSON.stringify(1),
        storageArea: localStorage,
      }),
    );
    expect(count).toBe(1);
  });

  it("exposes event builder on developer tools", () => {
    expect(typeof store._.event).toBe("function");
    const built = store._.event.call(
      store,
      "k",
      new StorageEvent("storage", {
        key: "k",
        newValue: JSON.stringify("v"),
        storageArea: localStorage,
      }),
    );
    expect(built.key).toBe("k");
    expect(built.newValue).toBe("v");
  });

  it("supports listener-only on, off, and once overloads", () => {
    let count = 0;
    const listener = () => {
      count++;
    };

    store.on(listener);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "any",
        newValue: JSON.stringify(1),
        storageArea: localStorage,
      }),
    );
    store.off(listener);

    store.once(listener);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "any",
        newValue: JSON.stringify(2),
        storageArea: localStorage,
      }),
    );
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "any",
        newValue: JSON.stringify(3),
        storageArea: localStorage,
      }),
    );

    expect(count).toBe(2);
  });

  it("includes ttl expiry metadata when cache extension is loaded", async () => {
    await import("../../src/extensions/cache");
    store.set("ttl-event", "payload", 60);
    const raw = localStorage.getItem("ttl-event");
    const built = store._.event.call(
      store,
      "ttl-event",
      new StorageEvent("storage", {
        key: "ttl-event",
        newValue: raw,
        storageArea: localStorage,
      }),
    );
    expect(built.expires).toBeDefined();
  });

  it("reads legacy uri and skips expiry metadata for non-ttl values", () => {
    const plain = store._.event.call(
      store,
      "plain",
      new StorageEvent("storage", {
        key: "plain",
        newValue: JSON.stringify("value"),
        storageArea: localStorage,
      }),
    );
    expect(plain.expires).toBeUndefined();

    const withUri = store._.event.call(
      store,
      "plain",
      Object.assign(new StorageEvent("storage", { key: "plain", storageArea: localStorage }), {
        uri: "http://example.test/",
      }),
    );
    expect(withUri.url).toBe("http://example.test/");
  });

  it("registers noop handlers when addEventListener is unavailable", async () => {
    const original = window.addEventListener;
    Object.defineProperty(window, "addEventListener", {
      configurable: true,
      value: undefined,
    });
    vi.resetModules();
    const { store: freshStore } = await import("../setup");
    await import("../../src/extensions/on");
    expect(() => freshStore.on(() => {})).not.toThrow();
    Object.defineProperty(window, "addEventListener", {
      configurable: true,
      value: original,
    });
    vi.resetModules();
    await import("../setup");
    await import("../../src/extensions/on");
  });
});
