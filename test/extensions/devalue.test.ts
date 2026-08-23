import { store } from "../setup";
import "../../src/extensions/devalue";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("devalue extension", () => {
  beforeEach(() => {
    store.clearAll();
    delete store._.revive;
    delete store._.replace;
    delete store._.devalueReducers;
    delete store._.devalueRevivers;
  });

  it("round-trips Dates", () => {
    const date = new Date("2026-01-15T12:00:00.000Z");
    store.set("when", date);
    expect(store.get("when")).toEqual(date);
  });

  it("round-trips undefined object properties", () => {
    store.set("sparse", { kept: 1, dropped: undefined });
    expect(store.get("sparse")).toEqual({ kept: 1, dropped: undefined });
  });

  it("round-trips Map and Set values", () => {
    store.set("map", new Map([["a", 1]]));
    store.set("set", new Set([1, 2]));
    expect(store.get("map")).toEqual(new Map([["a", 1]]));
    expect(store.get("set")).toEqual(new Set([1, 2]));
  });

  it("round-trips circular references", () => {
    const obj: { name: string; self?: unknown } = { name: "loop" };
    obj.self = obj;
    store.set("loop", obj);
    const got = store.get("loop") as typeof obj;
    expect(got.name).toBe("loop");
    expect(got.self).toBe(got);
  });

  it("falls back to JSON parse for legacy JSON values", () => {
    localStorage.setItem("legacy", JSON.stringify({ plain: true }));
    expect(store.get("legacy")).toEqual({ plain: true });
  });

  it("uses JSON when revive is configured", () => {
    store._.revive = (_key, value) => (value === "raw" ? "revived" : value);
    localStorage.setItem("rev", JSON.stringify("raw"));
    expect(store.get("rev")).toBe("revived");
  });

  it("supports custom devalue reducers and revivers", () => {
    class Point {
      constructor(
        public x: number,
        public y: number,
      ) {}
    }

    store._.devalueReducers = {
      Point: (value) => value instanceof Point && [value.x, value.y],
    };
    store._.devalueRevivers = {
      Point: (value) => {
        const [x, y] = value as [number, number];
        return new Point(x, y);
      },
    };

    store.set("point", new Point(3, 4));
    const got = store.get("point") as Point;
    expect(got).toBeInstanceOf(Point);
    expect(got.x).toBe(3);
    expect(got.y).toBe(4);
  });

  it("stringifies undefined and functions as strings", () => {
    expect(store._.stringify(undefined)).toBe("undefined");
    expect(store._.stringify(() => "fn")).toMatch(/function|=>/);
  });

  it("uses JSON stringify when replace is configured", () => {
    store._.replace = (_key, value) => value;
    expect(store._.stringify({ plain: true })).toBe('{"plain":true}');
  });

  it("falls back to JSON when devalue stringify fails", async () => {
    vi.doMock("devalue", () => ({
      stringify: () => {
        throw new Error("devalue failed");
      },
      parse: (source: string) => JSON.parse(source),
    }));
    vi.resetModules();
    const { default: freshStore } = await import("store2");
    await import("../../src/extensions/devalue");
    expect(freshStore._.stringify({ ok: true })).toBe('{"ok":true}');
    vi.doUnmock("devalue");
    vi.resetModules();
    await import("../../src/extensions/devalue");
  });

  it("falls back to JSON parse when devalue parse fails", async () => {
    expect(store._.parse("{bad")).toBe("{bad");
  });
});
