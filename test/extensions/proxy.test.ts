import store from "../../src/extensions/proxy";
import { beforeEach, describe, expect, it } from "vitest";

describe("proxy extension", () => {
  beforeEach(() => {
    store.clearAll();
  });

  it("reads and writes stored keys as properties", () => {
    store.greeting = "hello";
    expect(store.greeting).toBe("hello");
    expect(store.get("greeting")).toBe("hello");
  });

  it("supports callable store syntax", () => {
    store("callable", "value");
    expect(store.callable).toBe("value");
    expect(store("callable")).toBe("value");
  });

  it("prefers store API names over stored keys", () => {
    store.set("get", "stored");
    expect(typeof store.get).toBe("function");
    expect(store.get("get")).toBe("stored");
  });

  it("proxies session and namespace stores", () => {
    store.session.token = "abc";
    expect(store.session.token).toBe("abc");

    const ns = store.namespace("proxy-ns");
    ns.flag = true;
    expect(ns.flag).toBe(true);
    expect(ns.get("flag")).toBe(true);
    ns.clear();
  });

  it("reuses the same proxy for the same store target", () => {
    expect(store.local).toBe(store);
  });

  it("supports in and delete operators for stored keys", () => {
    store.visible = 1;
    expect("visible" in store).toBe(true);
    delete store.visible;
    expect("visible" in store).toBe(false);
    expect(store.has("visible")).toBe(false);
  });

  it("exposes wrapStore on developer tools", () => {
    expect(typeof store._.wrapStore).toBe("function");
    expect(typeof store._.wrapData).toBe("function");
  });

  it("persists nested object mutations", () => {
    store.profile = { user: { name: "Ada" } };
    store.profile.user.name = "Grace";
    expect(store.get("profile")).toEqual({ user: { name: "Grace" } });
    expect(store.profile.user.name).toBe("Grace");
  });

  it("persists deep nested object mutations", () => {
    store.tree = { a: { b: { c: 1 } } };
    store.tree.a.b.c = 2;
    expect(store.get("tree")).toEqual({ a: { b: { c: 2 } } });
  });

  it("persists nested property deletion", () => {
    store.profile = { user: { name: "Ada", temp: true } };
    delete store.profile.user.temp;
    expect(store.get("profile")).toEqual({ user: { name: "Ada" } });
  });

  it("persists nested array index assignments", () => {
    store.items = [{ label: "a" }, { label: "b" }];
    store.items[1].label = "B";
    expect(store.get("items")).toEqual([{ label: "a" }, { label: "B" }]);
  });

  it("persists nested array mutating methods", () => {
    store.items = ["a"];
    store.items.push("b");
    expect(store.get("items")).toEqual(["a", "b"]);
  });

  it("does not wrap non-object stored values", () => {
    store.count = 3;
    expect(store.count).toBe(3);
    expect(store._.wrapData(store, "count", 3)).toBe(3);
    expect(store._.wrapData(store, "name", "Ada")).toBe("Ada");
  });
});
