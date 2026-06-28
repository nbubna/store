import { store } from "../setup";
import "../../src/extensions/bind";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("bind extension", () => {
  beforeEach(() => {
    store.clearAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers on and off on the store api", () => {
    expect(typeof store.on).toBe("function");
    expect(typeof store.off).toBe("function");
  });

  it("delivers parsed storage events for a specific key", () => {
    const events: Array<{ key: string; newValue: unknown; namespace: string }> = [];
    const listener = (e: { key: string; newValue: unknown; namespace: string }) => {
      events.push({ key: e.key, newValue: e.newValue, namespace: e.namespace });
    };

    store.on("bound", listener);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "bound",
        newValue: JSON.stringify("hello"),
        storageArea: localStorage,
      }),
    );
    store.off("bound", listener);

    expect(events).toEqual([{ key: "bound", newValue: "hello", namespace: "" }]);
  });

  it("filters events by namespace", () => {
    const ns = store.namespace("bind-ns");
    const events: string[] = [];
    ns.on("item", (e: { key: string }) => events.push(e.key));

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "bind-ns.item",
        newValue: JSON.stringify(1),
        storageArea: localStorage,
      }),
    );
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "other.item",
        newValue: JSON.stringify(2),
        storageArea: localStorage,
      }),
    );

    expect(events).toEqual(["item"]);
  });

  it("supports catch-all listeners", () => {
    const events: string[] = [];
    const listener = (e: { key: string }) => events.push(e.key);
    store.on(listener);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "any",
        newValue: JSON.stringify(true),
        storageArea: localStorage,
      }),
    );
    store.off(listener);
    expect(events).toEqual(["any"]);
  });

  it("exposes id and event helpers on developer tools", () => {
    expect(typeof store._.id).toBe("function");
    expect(typeof store._.event).toBe("function");
    expect(store._.id(localStorage)).toBe("local");
  });
});
