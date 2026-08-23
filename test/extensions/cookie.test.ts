import { store } from "../setup";
import "../../src/extensions/cookie";
import { beforeEach, describe, expect, it } from "vitest";

describe("cookie extension", () => {
  beforeEach(() => {
    store.clearAll();
    document.cookie.split(";").forEach((part) => {
      const name = part.split("=")[0]?.trim();
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`;
      }
    });
  });

  it("exposes a cookie-backed store area", () => {
    expect(store.cookie).toBeTruthy();
    store.cookie.set("num", 42);
    expect(store.cookie.get("num")).toBe(42);
  });

  it("persists multiple keys in one cookie document", () => {
    store.cookie.set("a", 1);
    store.cookie.set("b", 2);
    expect(store.cookie.getAll()).toMatchObject({ a: 1, b: 2 });
  });

  it("supports remove and clear through the area api", () => {
    store.cookie.set("temp", "x");
    store.cookie.remove("temp");
    expect(store.cookie.get("temp")).toBeNull();
    store.cookie.set("stay", 1);
    store.cookie.clear();
    expect(store.cookie.get("stay")).toBeNull();
  });

  it("exposes low-level cookie helpers", () => {
    const C = store._.cookie;
    expect(typeof C.encode).toBe("function");
    expect(typeof C.decode).toBe("function");
    const encoded = C.encode({ hello: "world" });
    expect(C.decode(encoded)).toEqual({ hello: "world" });
    C.write({ from: "helper" });
    expect(C.read()?.from).toBe("helper");
  });

  it("reports area length and keys", () => {
    store.cookie.set("one", 1);
    store.cookie.set("two", 2);
    expect(store.cookie.size()).toBe(2);
    expect(store.cookie.keys().toSorted()).toEqual(["one", "two"]);
  });

  it("exposes low-level cookie area storage methods", () => {
    const area = store._.cookie.area;
    area.setItem("alpha", JSON.stringify(1));
    area.setItem("beta", JSON.stringify(2));
    expect(area.key(0)).toBe("alpha");
    expect(area.key(9)).toBeUndefined();
    expect(area.has("alpha")).toBe(true);
    expect(area.has("missing")).toBe(false);
    expect(area.length).toBe(2);
    area.removeItem("alpha");
    expect(area.getItem("alpha")).toBeNull();
  });
});
