import { store } from "../setup";
import "../../src/extensions/deep";
import { beforeEach, describe, expect, it } from "vitest";

describe("deep extension", () => {
  beforeEach(() => {
    store.clearAll();
  });

  it("reads nested paths with dot notation", () => {
    store.set("nested", { is: { not: { quite: false } } });
    expect(store.get("nested.is.not.quite")).toBe(false);
  });

  it("returns a stringified undefined for missing nested paths", () => {
    store.set("partial", { a: { b: 1 } });
    expect(store.get("partial.a.c.d")).toBe("undefined");
  });

  it("returns null when the root key is missing", () => {
    expect(store.get("missing.child")).toBeNull();
  });

  it("exposes split and resolvePath helpers", () => {
    expect(store._.split("foo.bar.baz")).toEqual(["foo.bar", "baz"]);
    expect(store._.resolvePath({ a: { b: 2 } }, "a.b")).toBe(2);
  });
});
