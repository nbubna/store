import "./helpers/load-all-extensions";
import { store } from "./setup";
import { expect, describe, it } from "vitest";

const API = [
  "get",
  "set",
  "transact",
  "has",
  "remove",
  "each",
  "namespace",
  "area",
  "getAll",
  "setAll",
  "keys",
  "isFake",
  "clear",
  "clearAll",
  "size",
];

function looseEqual(actual: unknown, expected: unknown) {
  expect(actual == expected).toBe(true);
}

function looseNotEqual(actual: unknown, expected: unknown) {
  expect(actual != expected).toBe(true);
}

function has(key: string, s?: Record<string, unknown>, sn?: string) {
  const target = s || (store as unknown as Record<string, unknown>);
  expect(key in target).toBe(true);
  void sn;
}

function is(key: string, expected: unknown, s?: typeof store, sn?: string) {
  looseEqual((s || store)[key as keyof typeof store], expected);
  void sn;
}

function noval(val: unknown) {
  expect(val === null || val === undefined).toBe(true);
}

function get(key: string, expected: unknown, s?: typeof store) {
  const value = (s || store).get(key);
  if (expected && typeof expected === "object") {
    expect(value).toEqual(expected);
  } else {
    looseEqual(value, expected);
  }
}

function save(key: string, val: unknown, s?: typeof store) {
  noval((s || store)(key, val));
  get(key, val, s);
}

function add(key: string, val: unknown, expected: unknown, s?: typeof store) {
  (s || store).add(key, val);
  get(key, expected, s);
}

function update(key: string | Record<string, unknown>, val?: unknown, s?: typeof store) {
  if (typeof key === "string" || val !== undefined) {
    expect((s || store)(key as string, val) != null).toBe(true);
    get(key as string, val, s);
  } else {
    looseEqual((s || store)(key), true);
    for (const k in key) {
      get(k, key[k], s);
    }
  }
}

function transact(key: string, fn: (val: unknown) => unknown, alt?: unknown, s?: typeof store) {
  const ret = (s || store)(key, fn, alt);
  expect(ret).toBe(s || store);
}

function getAll(
  expected: Record<string, unknown>,
  s?: typeof store,
  fillObj?: Record<string, unknown>,
) {
  if (fillObj) {
    expect((s || store).getAll(fillObj)).toEqual(expected);
  } else {
    expect((s || store)()).toEqual(expected);
  }
}

function keys(
  expected: string[],
  s?: typeof store,
  fillList?: string[] | { push: (key: string) => void; length: number },
) {
  const _keys = (s || store).keys(fillList as string[]);
  for (let i = 0, m = expected.length; i < m; i++) {
    if (_keys.indexOf) {
      expect(_keys.indexOf(expected[i]) >= 0).toBe(true);
    }
  }
  if (fillList) {
    expect(fillList).toBe(_keys);
  }
  looseEqual(_keys.length, expected.length);
}

function inArray(array: unknown[][], element: unknown[]) {
  for (let i = 0, m = array.length; i < m; i++) {
    if (element.toString() === array[i].toString()) {
      return true;
    }
  }
  return false;
}

function each(expected: unknown[][], s?: typeof store) {
  (s || store).each(function (k, v) {
    expect(inArray(expected, [k, v])).toBe(true);
  });
}

function remove(key: string, expected: unknown, s?: typeof store) {
  looseEqual((s || store).remove(key), expected);
  get(key, null, s);
}

function clear(s?: typeof store) {
  looseEqual((s || store).clear(), s || store);
  getAll({}, s);
  looseEqual((s || store).size(), 0);
}

function clearAll(s?: typeof store) {
  expect((s || store).clearAll()).toBeTruthy();
  getAll({}, s);
  looseEqual((s || store).size(), 0);
}

function space(ns: string, singleArea?: boolean, delim?: string) {
  looseEqual(store.namespace(ns, singleArea as true, delim), store[ns as keyof typeof store]);
  looseEqual(store.isFake(), (store[ns as keyof typeof store] as typeof store).isFake());
  if (delim) {
    looseEqual(
      (store[ns as keyof typeof store] as typeof store & { _delim: string })._delim,
      delim,
    );
  } else {
    looseEqual(
      (store[ns as keyof typeof store] as typeof store & { _delim: string })._delim,
      store._.nsdelim,
    );
  }
  return store[ns as keyof typeof store] as typeof store;
}

function area(id: string) {
  const s = store.area(id);
  const storage = s._area;
  has(id);
  looseEqual(id, s._id);
  is("_area", store._.areas[id], s);
  for (const n in store._.storageAPI) {
    if (n !== "has" && n !== "toString" && n !== "name" && n !== "items") {
      has(n, storage as unknown as Record<string, unknown>, id);
    }
  }
  looseEqual(s._area, store._.areas[id]);
  looseEqual(store[id as keyof typeof store]._area, s._area);
  return s;
}

describe("store2", () => {
  it("interface", () => {
    expect(store).toBeTruthy();
    for (let i = 0; i < API.length; i++) {
      has(API[i]);
    }
    has("version", store._ as unknown as Record<string, unknown>);
  });

  it("shortcuts", () => {
    looseEqual(store("new", "key"), null);
    looseEqual(store("new", "notsomuch"), "key");
    looseEqual(store("new"), "notsomuch");
    looseEqual(store("nonesuch"), null);
    store(false);
    looseEqual(store.size(), 0);
    store({ key: 1, key2: 2 });
    looseEqual(store.size(), 2);
    store("key", function (v) {
      looseEqual(v, 1);
      return "one";
    });
    looseEqual(store("key"), "one");
    store(
      "key3",
      function (v) {
        looseEqual(v, "alt");
      },
      "alt",
    );
    expect(store("key3", "alt")).toBeTruthy();
    store.remove("key3");
    let first = false;
    let second = false;
    store(function (k, v) {
      if (k === "key") {
        looseEqual(v, "one");
        first = true;
      } else if (k === "key2") {
        looseEqual(v, 2);
        second = true;
      } else {
        expect(false).toBe(true);
      }
    });
    expect(first && second).toBe(true);
  });

  it("basics", () => {
    clear();
    expect(store._id).toEqual("local");
    expect(!store.isFake()).toBe(true);
    save("foo", "bar");
    getAll({ foo: "bar" });
    update({ fiz: "wiz", foo: true });
    update("foo", false);
    keys(["foo", "fiz"]);
    each([
      ["fiz", "wiz"],
      ["foo", false],
    ]);
    looseEqual(store.size(), 2);
    transact("fiz", function (fiz) {
      looseEqual(fiz, "wiz");
      return "whiz";
    });
    add("fiz", "zy", "whizzy");
    remove("fiz", "whizzy");
    looseEqual(store.remove("fiz", "alt"), "alt");
    transact(
      "obj",
      function (obj) {
        (obj as { prop: boolean }).prop = false;
      },
      { prop: true },
    );
    looseEqual(store.get("obj").prop, false);
    add("obj", { b: 1 }, { prop: false, b: 1 });
    add("num", 1, 1);
    add("num", 1, 2);
    save("array", [1]);
    add("array", 2, [1, 2]);
    add("array", [3, 4], [1, 2, 3, 4]);
    remove("woogie", undefined);
    get("foo", false);
    clearAll();
  });

  it("advanced keys", () => {
    const ns = space("fancykeys");
    ns("foo", "bar");
    keys(["fig", "foo"], ns, ["fig"]);
    keys(["foo"], ns, {
      push: function (key: string) {
        looseEqual("foo", key);
        this.length++;
      },
      length: 0,
    });
    ns.clear();
  });

  it("advanced getAll", () => {
    const ns = space("getyall");
    ns("foo", "bar");
    const obj = { fig: "wig" };
    getAll({ foo: "bar", fig: "wig" }, ns, obj);
    expect(["fig", "foo"]).toEqual(Object.keys(obj));
    ns.clear();
    const nothing = Object("nothing");
    const res = ns.getAll(nothing);
    expect(nothing).toBe(res);
  });

  it("namespace", () => {
    save("foo", true);
    const ns = space("test");
    looseEqual(ns + "", "store.test[local]");
    getAll({}, ns);
    save("a", "b", ns);
    get("test.a", "b");
    each([["a", "b"]], ns);
    each([
      ["foo", true],
      ["test.a", "b"],
    ]);
    each([], space("empty"));
    save("test.", "true", ns);
    remove("test.test.", "true");
    get("foo", null, ns);
    getAll({ a: "b" }, ns);
    update("a", 26.2, ns);
    clear(ns);
    getAll({ foo: true });
    clearAll();
  });

  it("advanced namespace", () => {
    save("foo", true);
    const ns = space("lonely", true, ":");
    looseEqual(store.session.lonely, null);
    looseEqual(store.local.lonely, ns);
    looseNotEqual(null, ns);
    store.lonely("foo", "bar");
    looseEqual(store("lonely:foo"), "bar");
  });

  it("areas", () => {
    const local = area("local");
    looseEqual(local, store);
    const session = area("session");
    expect(session !== store).toBe(true);
    area("fake", true);
    const page = area("page");
    expect(page !== store).toBe(true);
    expect(page !== store.session).toBe(true);
    expect(!page.isFake()).toBe(true);
  });

  it("fake area clearing", () => {
    const fake = area("faketest");
    fake("key", "value");
    fake("key2", "value2");
    looseEqual(fake("key"), "value");
    looseEqual(fake("key2"), "value2");
    looseEqual(fake.size(), 2);
    fake.clear();
    looseEqual(fake("key"), undefined);
    looseEqual(fake("key2"), undefined);
    looseEqual(fake.size(), 0);
  });

  it("tricky for us", () => {
    save(null as unknown as string, null);
    save(undefined as unknown as string, "undefined");
    save(0 as unknown as string, "0");
    save([] as unknown as string, "[]");
    save({} as unknown as string, 0);
    save({ a: { b: true } }, false);
    save(function a() {} as unknown as string, "whatever");
    clear();
  });

  it("per-call reviver", () => {
    const dateRE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
    function revive(_key: string, value: unknown) {
      if (typeof value === "string" && dateRE.test(value)) {
        return new Date(value);
      }
      return value;
    }
    store.set("date", new Date());
    let revived = store.get("date", revive);
    looseEqual(revived.constructor.name, "Date");
    store.set("dated", { date: new Date() });
    revived = store.get("dated", revive);
    looseEqual(typeof revived.date, "object");
    store.remove("date");
    store.remove("dated");
  });

  it("per-call replacer", () => {
    function replace(key: string, value: unknown) {
      if (key === "foo") {
        return "bar";
      }
      return value;
    }
    store.set("test", { foo: "foo" }, replace);
    const replaced = store.get("test");
    looseEqual(replaced.foo, "bar");
    store.remove("test");
  });

  it("rich reviver", () => {
    const obj = { woogie: { rich: { bar: true } } };
    store.session.set("obj", obj);
    function RichType(this: Record<string, unknown>) {}
    RichType.prototype.set = function (k: string, v: unknown) {
      this[k] = v;
    };
    RichType.prototype.get = function (k: string) {
      return this[k];
    };
    function reviver(key: string, value: unknown) {
      if (key === "rich") {
        const rich = new (
          RichType as unknown as new () => Record<string, unknown> & {
            set: (k: string, v: unknown) => void;
            get: (k: string) => unknown;
          }
        )();
        Object.keys(value as object).forEach(function (k) {
          rich.set(k, (value as Record<string, unknown>)[k]);
        });
        return rich;
      }
      return value;
    }
    const revived = store.session.get("obj", reviver);
    looseEqual(revived.woogie.rich.constructor.name, "RichType");
    looseEqual(revived.woogie.rich.get("bar"), true);
    store.session.remove("obj");
  });

  it("rich replacer", () => {
    function TestType(this: Record<string, unknown>) {}
    TestType.prototype.test = function () {
      return true;
    };
    store.set(
      "test",
      { test: new (TestType as unknown as new () => { test: () => boolean })() },
      function replace(key: string, value: unknown) {
        if (key === "test") {
          return "TestType";
        }
        return value;
      },
    );
    expect(store.get("test")).toEqual({ test: "TestType" });
    const got = store.get("test", function revive(_key: string, value: unknown) {
      if (value === "TestType") {
        return new (TestType as unknown as new () => { test: () => boolean })();
      }
      return value;
    });
    looseEqual(got.test instanceof TestType, true);
    looseEqual(got.test.test(), true);
    store.remove("test");
  });

  it("global revive", () => {
    const dateRE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
    store._.revive = function reviveDates(_key: string, value: unknown) {
      if (typeof value === "string" && dateRE.test(value)) {
        return new Date(value);
      }
      return value;
    };
    store.set("date", new Date());
    let revived = store.get("date");
    looseEqual(revived.constructor.name, "Date");
    store.set("dated", { date: new Date() });
    revived = store.get("dated");
    looseEqual(typeof revived.date, "object");
    store.remove("date");
    store.remove("dated");
  });

  it("global replace", () => {
    function TestType(this: Record<string, unknown>) {}
    TestType.prototype.test = function () {
      return true;
    };
    store._.replace = function replace(_key: string, value: unknown) {
      if (value instanceof TestType) {
        return "TestType";
      }
      return value;
    };
    store.set("obj", { prop: new (TestType as unknown as new () => object)() });
    const obj = store.get("obj");
    looseEqual(obj.prop, "TestType");
  });

  it("#117 global replace surprises like Date/toJSON", () => {
    function TestType(this: Record<string, unknown>) {}
    TestType.prototype.toJSON = function () {
      return "toJSON'ed!";
    };
    store._.replace = function replace(_key: string, value: unknown) {
      if (value instanceof Date) {
        return "A Date!";
      }
      if (value instanceof TestType) {
        return "TestType";
      }
      return value;
    };
    store.set("obj", { prop: new Date() });
    let obj = store.get("obj");
    looseNotEqual(obj.prop, "A Date!");
    store.set("obj", { prop: new (TestType as unknown as new () => object)() });
    obj = store.get("obj");
    looseNotEqual(obj.prop, "TestType");
    looseEqual(obj.prop, "toJSON'ed!");
  });

  it("#74 falsy alt support", () => {
    expect(store.get("noValue")).toBe(null);
    expect(store.get("noValue", false)).toBe(false);
    expect(store.get("noValue", 0)).toBe(0);
    expect(store.get("noValue", "")).toBe("");
    store.set("noValue", "value");
    expect(store.get("noValue")).toBe("value");
    expect(store.get("noValue", false)).toBe("value");
    expect(store.get("noValue", 0)).toBe("value");
    expect(store.get("noValue", "")).toBe("value");
    clear();
  });

  it("#94 isFake(force) support", () => {
    looseEqual(false, store.isFake());
    store.set("foo", "bar");
    looseEqual("bar", store.get("foo"));
    looseEqual(true, store.isFake(true));
    looseEqual(null, store.get("foo"));
    store.set("bar", "foo");
    looseEqual("foo", store.get("bar"));
    looseEqual(false, store.isFake(false));
    looseEqual("bar", store.get("foo"));
    store.isFake(true);
    looseEqual(true, store.isFake());
    looseEqual(null, store.get("bar"));
    store.isFake(false);
  });

  it("parse returns raw string for invalid json", () => {
    localStorage.setItem("badparse", "{invalid");
    looseEqual(store.get("badparse"), "{invalid");
    store.remove("badparse");
  });

  it("namespace returns empty string on root store", () => {
    looseEqual(store.namespace(), "");
  });

  it("namespace returns current namespace when called without args", () => {
    const ns = store.namespace("named");
    looseEqual(ns.namespace(), "named");
    ns.clear();
  });

  it("namespace reuses existing namespace instance", () => {
    const first = store.namespace("reuse");
    const second = store.namespace("reuse");
    expect(first).toBe(second);
    first.clear();
  });

  it("toString reflects namespace and area", () => {
    looseEqual(store + "", "store[local]");
    const ns = store.namespace("str");
    looseEqual(ns + "", "store.str[local]");
    ns.clear();
  });

  it("isFake(false) is safe when storage was never forced fake", () => {
    looseEqual(store.isFake(false), store.isFake());
  });

  it("preserves conflicting global store reference", async () => {
    const prior = { prior: true };
    (window as Window & { store: unknown }).store = prior;
    vi.resetModules();
    const mod = await import("store2");
    expect(mod.default._.conflict).toBe(prior);
    (window as Window & { store: typeof store }).store = store;
  });

  it("falls back to fake storage when localStorage throws on init", async () => {
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });
    vi.resetModules();
    const mod = await import("store2");
    expect(mod.default.isFake()).toBe(true);
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: original,
    });
  });

  it("falls back when sessionStorage throws on init", async () => {
    const original = globalThis.sessionStorage;
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });
    vi.resetModules();
    const mod = await import("store2");
    expect(mod.default.session.isFake()).toBe(true);
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: original,
    });
  });

  it("has uses storage area has hook when available", () => {
    store.page.set("hooked", true);
    expect(store.page.has("hooked")).toBe(true);
    expect(store.page.has("missing")).toBe(false);
  });

  it("each stops when callback returns false", () => {
    store.set("a", 1);
    store.set("b", 2);
    store.set("c", 3);
    const seen: string[] = [];
    store.each(function (k) {
      seen.push(k as string);
      return k === "b" ? false : undefined;
    });
    expect(seen).toEqual(["a", "b"]);
  });

  it("set skips overwrite when overwrite is false and key exists", () => {
    store.set("keep", "original");
    looseEqual(store.set("keep", "new", false), "new");
    looseEqual(store.get("keep"), "original");
    store.remove("keep");
  });

  it("tricky for browsers", () => {
    const isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
    if (!isFirefox) {
      return;
    }
    save("getItem", true);
    save("setItem", 12.2);
    save("clear", "boo");
    save("removeItem", "hi");
    save("key", {});
    save("length", 1);
    update("length", 2);
    clear();
  });
});

describe("store.cache", () => {
  it("expires values after ttl", () => {
    clear();
    store.set("time", "in", 100);
    expect(store.has("time")).toBe(true);
    looseEqual(store("time"), "in");
    const val = localStorage.getItem("time");
    looseNotEqual(val, null);
    expect(val!.indexOf("exp@") === 0).toBe(true);
    expect(val!.indexOf(";") > 4).toBe(true);
    vi.useFakeTimers();
    store.set("time", "out", 0.001);
    vi.advanceTimersByTime(2);
    looseEqual(store.get("time"), null);
    vi.useRealTimers();
  });
});

describe("storage events", () => {
  it("handles storage events for namespaced keys", () => {
    const events = store.namespace("events");
    const received: Array<{
      key: string;
      namespace: string;
      oldValue: unknown;
      newValue: unknown;
    }> = [];
    events.on("foo", function (e) {
      received.push({
        key: e.key,
        namespace: e.namespace,
        oldValue: e.oldValue,
        newValue: e.newValue,
      });
    });

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "events.foo",
        newValue: JSON.stringify({ a: 1, b: 2 }),
        storageArea: localStorage,
      }),
    );
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "events.foo",
        oldValue: JSON.stringify({ a: 1, b: 2 }),
        newValue: JSON.stringify(true),
        storageArea: localStorage,
      }),
    );
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "events.foo",
        oldValue: JSON.stringify(true),
        newValue: null,
        storageArea: localStorage,
      }),
    );

    expect(received.length).toBe(3);
    looseEqual("events", received[0].namespace);
    looseEqual("foo", received[0].key);
    expect(!received[0].oldValue).toBe(true);
    looseEqual(2, received[1].oldValue.b);
    looseEqual(true, received[1].newValue);
    expect(!received[2].newValue).toBe(true);
  });
});
