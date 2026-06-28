import { store } from "../setup";
import "../../src/extensions/array";
import { beforeEach, describe, expect, it } from "vitest";

describe("array extension", () => {
  beforeEach(() => {
    store.clearAll();
  });

  it("push appends to stored arrays", () => {
    store.push("items", "a", "b");
    expect(store.get("items")).toEqual(["a", "b"]);
    expect(store.indexOf("items", "b")).toBe(1);
  });

  it("treats missing values as empty arrays", () => {
    expect(store.pop("missing")).toBeUndefined();
    expect(store.has("missing")).toBe(false);
  });

  it("wraps non-array values before applying array methods", () => {
    store.set("solo", "only");
    store.push("solo", "second");
    expect(store.get("solo")).toEqual(["only", "second"]);
  });

  it("stores a single element when length becomes one", () => {
    store.set("pair", ["x", "y"]);
    store.pop("pair");
    expect(store.get("pair")).toBe("x");
  });

  it("removes the key when an array method empties the value", () => {
    store.set("temp", ["gone"]);
    store.pop("temp");
    expect(store.has("temp")).toBe(false);
  });

  it("slice returns without mutating storage", () => {
    store.set("nums", [1, 2, 3]);
    expect(store.slice("nums", 1)).toEqual([2, 3]);
    expect(store.get("nums")).toEqual([1, 2, 3]);
  });

  it("slice supports negative start indices", () => {
    store.set("nums", [1, 2, 3, 4]);
    expect(store.slice("nums", -2)).toEqual([3, 4]);
    expect(store.get("nums")).toEqual([1, 2, 3, 4]);
  });

  it("splice removes and inserts elements while updating storage", () => {
    store.set("list", ["a", "b", "c", "d"]);
    expect(store.splice("list", 1, 2, "x", "y")).toEqual(["b", "c"]);
    expect(store.get("list")).toEqual(["a", "x", "y", "d"]);
  });

  it("splice removing all elements deletes the key", () => {
    store.set("list", ["only"]);
    expect(store.splice("list", 0, 1)).toEqual(["only"]);
    expect(store.has("list")).toBe(false);
  });

  it("unshift prepends values and updates storage", () => {
    store.set("queue", ["c"]);
    expect(store.unshift("queue", "a", "b")).toBe(3);
    expect(store.get("queue")).toEqual(["a", "b", "c"]);
  });

  it("unshift on a missing key stores a single prepended value", () => {
    expect(store.unshift("fresh", "first")).toBe(1);
    expect(store.get("fresh")).toBe("first");
  });

  it("at returns an element without mutating storage", () => {
    store.set("nums", [10, 20, 30]);
    expect(store.at("nums", 1)).toBe(20);
    expect(store.at("nums", -1)).toBe(30);
    expect(store.get("nums")).toEqual([10, 20, 30]);
  });

  it("at on a missing key reads from an empty array", () => {
    expect(store.at("missing", 0)).toBeUndefined();
    expect(store.has("missing")).toBe(false);
  });

  it("shift removes the first element and updates storage", () => {
    store.set("queue", ["a", "b", "c"]);
    expect(store.shift("queue")).toBe("a");
    expect(store.get("queue")).toEqual(["b", "c"]);
  });

  it("shift on one remaining element stores a scalar", () => {
    store.set("pair", ["x", "y"]);
    expect(store.shift("pair")).toBe("x");
    expect(store.get("pair")).toBe("y");
  });

  it("shift on a single element removes the key", () => {
    store.set("solo", ["only"]);
    expect(store.shift("solo")).toBe("only");
    expect(store.has("solo")).toBe(false);
  });

  it("reverse mutates storage in place", () => {
    store.set("nums", [1, 2, 3]);
    expect(store.reverse("nums")).toEqual([3, 2, 1]);
    expect(store.get("nums")).toEqual([3, 2, 1]);
  });

  it("sort mutates storage in place", () => {
    store.set("nums", [3, 1, 2]);
    expect(store.sort("nums")).toEqual([1, 2, 3]);
    expect(store.get("nums")).toEqual([1, 2, 3]);
  });

  it("concat returns a new array without mutating storage", () => {
    store.set("nums", [1, 2]);
    expect(store.concat("nums", [3, 4])).toEqual([1, 2, 3, 4]);
    expect(store.get("nums")).toEqual([1, 2]);
  });

  it("join returns a string without mutating storage", () => {
    store.set("words", ["a", "b", "c"]);
    expect(store.join("words", "-")).toBe("a-b-c");
    expect(store.get("words")).toEqual(["a", "b", "c"]);
  });

  it("filter returns matches without mutating storage", () => {
    store.set("nums", [1, 2, 3, 4]);
    expect(store.filter("nums", (n: number) => n % 2 === 0)).toEqual([2, 4]);
    expect(store.get("nums")).toEqual([1, 2, 3, 4]);
  });

  it("map returns transformed values without mutating storage", () => {
    store.set("nums", [1, 2, 3]);
    expect(store.map("nums", (n: number) => n * 2)).toEqual([2, 4, 6]);
    expect(store.get("nums")).toEqual([1, 2, 3]);
  });

  it("includes and findIndex search without mutating storage", () => {
    store.set("letters", ["a", "b", "c"]);
    expect(store.includes("letters", "b")).toBe(true);
    expect(store.findIndex("letters", (v: string) => v === "c")).toBe(2);
    expect(store.get("letters")).toEqual(["a", "b", "c"]);
  });

  it("reduce accumulates without mutating storage", () => {
    store.set("nums", [1, 2, 3, 4]);
    expect(store.reduce("nums", (sum: number, n: number) => sum + n, 0)).toBe(10);
    expect(store.get("nums")).toEqual([1, 2, 3, 4]);
  });

  it("exposes array on developer tools", () => {
    expect(typeof store._.array).toBe("function");
    expect(typeof store._.arrayFn).toBe("function");
  });
});
