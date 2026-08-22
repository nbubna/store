import { store } from "../setup";
import "../../src/extensions/quota";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function quotaExceeded() {
  const err = new Error("quota");
  err.name = "QUOTA_EXCEEDED_ERR";
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
      throw quotaExceeded();
    }
    return original.call(this, key, value);
  });
}

describe("quota extension", () => {
  beforeEach(() => {
    store.clearAll();
    store.quota.fns.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    store.quota.fns.length = 0;
  });

  it("registers quota handlers", () => {
    expect(typeof store.quota).toBe("function");
    expect(Array.isArray(store.quota.fns)).toBe(true);
    const handler = vi.fn();
    store.quota(handler);
    expect(store.quota.fns).toContain(handler);
  });

  it("invokes handlers when storage throws quota errors", () => {
    const handler = vi.fn(() => true);
    store.quota(handler);
    mockPrimaryQuota();

    expect(() => store.set("blocked", "value")).not.toThrow();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]?.[2]).toBe("blocked");
  });

  it("rethrows when no handler suppresses the error", () => {
    store.quota(() => false);
    mockPrimaryQuota();

    expect(() => store.set("fail", "value")).toThrow();
  });

  it("stops calling handlers after one returns true", () => {
    const first = vi.fn(() => true);
    const second = vi.fn();
    store.quota(first);
    store.quota(second);
    mockPrimaryQuota();

    store.set("stop", "value");
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });
});
