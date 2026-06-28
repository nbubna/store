import { store } from "../setup";
import "../../src/extensions/dot";
import { beforeEach, describe, expect, it } from "vitest";

describe("dot extension", () => {
  beforeEach(() => {
    store.clearAll();
  });

  it("adds property accessors for explicit keys", () => {
    store.dot("greeting");
    store.greeting = "hello";
    expect(store.greeting).toBe("hello");
    expect(store.get("greeting")).toBe("hello");
  });

  it("accepts multiple keys and arrays of keys", () => {
    store.dot("one", "two");
    store.dot(["three"]);
    store.one = 1;
    store.two = 2;
    store.three = 3;
    expect(store.get("one")).toBe(1);
    expect(store.get("two")).toBe(2);
    expect(store.get("three")).toBe(3);
  });

  it("defines accessors for all existing keys when called without args", () => {
    store.set("alpha", "a");
    store.set("beta", "b");
    store.dot();
    expect(store.alpha).toBe("a");
    expect(store.beta).toBe("b");
  });

  it("does not clobber existing store properties", () => {
    expect("get" in store).toBe(true);
    store.dot("get");
    expect(typeof store.get).toBe("function");
  });

  it("exposes dot.define on developer tools", () => {
    expect(typeof store._.dot).toBe("function");
    expect(typeof store._.dot.define).toBe("function");
  });
});
