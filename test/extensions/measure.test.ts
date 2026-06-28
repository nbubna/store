import { store } from "../setup";
import "../../src/extensions/measure";
import { beforeEach, describe, expect, it } from "vitest";

describe("measure extension", () => {
  beforeEach(() => {
    store.clearAll();
  });

  it("reports characters used by stored data", () => {
    store.set("m", "x");
    expect(store.charsUsed()).toBeGreaterThan(0);
    store.clearAll();
    expect(store.charsUsed()).toBeGreaterThanOrEqual(0);
  });

  it("returns undefined remainingSpace when unsupported", () => {
    expect(store.remainingSpace()).toBeUndefined();
  });

  it("skips charsLeft on fake storage", () => {
    const fake = store.area("measure-fake");
    fake.isFake(true);
    expect(fake.charsLeft(true)).toBeUndefined();
  });
});
