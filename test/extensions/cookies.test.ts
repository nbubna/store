import { store } from "../setup";
import "../../src/extensions/cookies";
import { beforeEach, describe, expect, it } from "vitest";

describe("cookies extension", () => {
  beforeEach(() => {
    store.clearAll();
    document.cookie.split(";").forEach((part) => {
      const name = part.split("=")[0]?.trim();
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`;
      }
    });
  });

  it("exposes a per-key cookie store area", () => {
    expect(store.cookies).toBeTruthy();
    store.cookies.set("user", "test");
    expect(store.cookies.get("user")).toBe("test");
  });

  it("stores each value in its own cookie", () => {
    store.cookies.set("a", "1");
    store.cookies.set("b", "2");
    expect(document.cookie).toContain("a=");
    expect(document.cookie).toContain("b=");
  });

  it("removes individual cookies", () => {
    store.cookies.set("gone", "yes");
    store.cookies.remove("gone");
    expect(store.cookies.get("gone")).toBeNull();
  });

  it("clears all managed cookies", () => {
    store.cookies.set("one", "1");
    store.cookies.set("two", "2");
    store.cookies.clear();
    expect(store.cookies.get("one")).toBeNull();
    expect(store.cookies.get("two")).toBeNull();
  });

  it("exposes helper read/write/all methods", () => {
    const C = store._.cookies;
    C.write("helper", "value");
    expect(C.read("helper")).toBe("value");
    expect(C.all().helper).toBe("value");
    C.remove("helper");
    expect(C.read("helper")).toBeNull();
  });

  it("exposes low-level cookies area storage methods", () => {
    const area = store._.cookies.area;
    area.setItem("one", JSON.stringify("1"));
    area.setItem("two", JSON.stringify("2"));
    expect(area.key(0)).toBe("one");
    expect(area.key(9)).toBeUndefined();
    expect(area.has("one")).toBe(true);
    expect(area.length).toBe(2);
    area.clear();
    expect(area.length).toBe(0);
  });
});
