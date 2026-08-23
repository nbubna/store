import { store } from "../setup";
import { afterEach, describe, expect, it } from "vitest";
import type { InternalSupport, StoreAPIInternal } from "../../src/internal";

describe("onlyreal extension", () => {
  let previousSet: InternalSupport["set"];

  const internal = () => store._ as unknown as InternalSupport;

  afterEach(() => {
    if (previousSet) {
      internal().set = previousSet;
    }
  });

  it("skips writes to fake storage but allows real storage", async () => {
    previousSet = internal().set.bind(internal());
    await import("../../src/extensions/onlyreal");

    const fake = store.area("onlyreal-test");
    fake.isFake(true);
    expect(fake.set("skip", "me")).toBeNull();
    expect(fake.get("skip")).toBeNull();

    store.set("onlyreal-real", "ok");
    expect(store.get("onlyreal-real")).toBe("ok");
  });

  it("still allows reads from fake storage", async () => {
    previousSet = internal().set.bind(internal());
    await import("../../src/extensions/onlyreal");

    const fake = store.area("onlyreal-read") as unknown as StoreAPIInternal;
    fake.isFake(true);
    internal().set(fake._area, fake._in("seed"), JSON.stringify("value"));
    expect(fake.get("seed")).toBe("value");
  });
});
