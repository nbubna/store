import { store } from "../setup";
import "../../src/extensions/overflow";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function quotaError() {
  const err = new Error("quota");
  err.name = "QuotaExceededError";
  return err;
}

function mockPrimaryQuota() {
  const primary = store._area;
  const original = Storage.prototype.setItem;
  return vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
    key: string,
    value: string,
  ) {
    if (this === primary) {
      throw quotaError();
    }
    return original.call(this, key, value);
  });
}

describe("overflow extension", () => {
  beforeEach(() => {
    store.clearAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps local storage writable under normal conditions", () => {
    store.set("overflow", 1);
    expect(store.get("overflow")).toBe(1);
  });

  it("redirects writes to overflow storage on quota errors", () => {
    mockPrimaryQuota();
    store.set("of-key", "value");
    expect(store.get("of-key")).toBe("value");
    expect(store._.overflow(store._area)).toBeTruthy();
  });

  it("reads values from overflow storage after quota failure", () => {
    mockPrimaryQuota();
    store.set("shadow", "cached");
    expect(store.get("shadow")).toBe("cached");
  });

  it("clears overflow storage when the primary area is cleared", () => {
    mockPrimaryQuota();
    store.set("temp", "data");
    store.clear();
    expect(store.get("temp")).toBeNull();
    expect(store._.overflow(store._area)).toBeUndefined();
  });

  it("exposes overflow helper on developer tools", () => {
    expect(typeof store._.overflow).toBe("function");
    expect(store._.overflow(store._area)).toBeUndefined();
  });
});
