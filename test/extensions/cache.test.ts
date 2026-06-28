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
});
