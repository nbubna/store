import { store } from "../setup";
import "../../src/extensions/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("cache extension", () => {
  beforeEach(() => {
    store.clearAll();
    vi.useRealTimers();
  });

  it("stores ttl metadata in raw storage", () => {
    store.set("ttl", "ok", 60);
    expect(store.has("ttl")).toBe(true);
    const raw = localStorage.getItem("ttl");
    expect(raw?.startsWith("exp@")).toBe(true);
    expect(raw?.includes(";")).toBe(true);
  });

  it("returns parsed values while ttl is active", () => {
    store.set("fresh", { a: 1 }, 120);
    expect(store.get("fresh")).toEqual({ a: 1 });
  });

  it("expires values after ttl elapses", () => {
    store.set("time", "in", 100);
    expect(store.get("time")).toBe("in");

    vi.useFakeTimers();
    store.set("time", "out", 0.001);
    vi.advanceTimersByTime(2);
    expect(store.get("time")).toBeNull();
    vi.useRealTimers();
  });

  it("strips ttl prefix during parse", () => {
    const raw = `exp@${Math.floor(Date.now() / 1000) + 60};${JSON.stringify("payload")}`;
    expect(store._.parse(raw)).toBe("payload");
  });

  it("exposes cache helpers on developer tools", () => {
    expect(typeof store._.expires).toBe("function");
    expect(typeof store._.when).toBe("function");
    expect(typeof store._.cache).toBe("function");
    expect(store._.expires("exp@123;value")).toBe(123);
  });

  it("retries set after evicting expired ttl entries on quota errors", () => {
    const area = store._area;
    const nativeSetItem = Storage.prototype.setItem;
    area.setItem("other", JSON.stringify("keep"));

    let attempts = 0;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (this === area) {
        attempts++;
        if (attempts === 1) {
          const err = new Error("quota");
          err.name = "QUOTA_EXCEEDED_ERR";
          throw err;
        }
      }
      return nativeSetItem.call(this, key, value);
    });
    vi.spyOn(store._, "cache").mockReturnValue(undefined);

    store._.set(area, "retry", JSON.stringify("new"), 60);
    expect(attempts).toBe(2);
    expect(area.getItem("retry")).toContain("new");
  });

  it("rethrows quota errors when nothing expired can be evicted", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      const err = new Error("quota");
      err.name = "QUOTA_EXCEEDED_ERR";
      throw err;
    });
    expect(() => store._.set(store._area, "blocked", JSON.stringify("v"))).toThrow("quota");
  });
});
