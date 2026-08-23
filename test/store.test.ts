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
  // oxlint-disable-next-line eqeqeq
  expect(actual == expected).toBe(true);
}

function looseNotEqual(actual: unknown, expected: unknown) {
  // oxlint-disable-next-line eqeqeq
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
  const useDeepEqual = expected !== null && typeof expected === "object";
  expect(
    useDeepEqual
      ? JSON.stringify(value) === JSON.stringify(expected)
      : // oxlint-disable-next-line eqeqeq
        value == expected,
  ).toBe(true);
}

function save(key: string, val: unknown, s?: typeof store) {
  noval((s || store)(key, val));
  get(key, val, s);
}

function add(key: string, val: unknown, expected: unknown, s?: typeof store) {
  (s || store).add(key, val);
  get(key, expected, s);
}

function updateKeyValue(key: string, val: unknown, s?: typeof store) {
  const result = (s || store)(key, val);
  expect(result !== null && result !== undefined).toBe(true);
  get(key, val, s);
}

function updateObject(obj: Record<string, unknown>, s?: typeof store) {
  looseEqual((s || store)(obj), true);
  for (const k in obj) {
    get(k, obj[k], s);
  }
}

function update(key: string | Record<string, unknown>, val?: unknown, s?: typeof store) {
  if (typeof key === "string" || val !== undefined) {
    updateKeyValue(key as string, val, s);
    return;
  }
  updateObject(key, s);
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
  const actual = fillObj ? (s || store).getAll(fillObj) : (s || store)();
  expect(actual).toEqual(expected);
}

function keys(
  expected: string[],
  s?: typeof store,
  fillList?: string[] | { push: (key: string) => void; length: number },
) {
  const _keys = (s || store).keys(fillList as string[]);
  const canIndex = typeof _keys.indexOf === "function";
  for (let i = 0, m = expected.length; i < m; i++) {
    const found = canIndex ? _keys.indexOf(expected[i]) >= 0 : true;
    expect(found).toBe(true);
  }
  expect(fillList ? fillList === _keys : true).toBe(true);
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
      has(n, storage, id);
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
    has("version", store._);
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
    expect(store).toBeDefined();
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
    expect(store).toBeDefined();
  });

  it("advanced namespace", () => {
    save("foo", true);
    const ns = space("lonely", true, ":");
    looseEqual(store.session.lonely, null);
    looseEqual(store.local.lonely, ns);
    looseNotEqual(null, ns);
    store.lonely("foo", "bar");
    looseEqual(store("lonely:foo"), "bar");
    expect(store).toBeDefined();
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
    expect(store).toBeDefined();
  });

  it("fake storage key returns undefined past the last index", () => {
    const fake = store.area("fake-key-range");
    fake.set("only", 1);
    expect(fake._area.key(1)).toBeUndefined();
    fake.clear();
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
    expect(store).toBeDefined();
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
    expect(store).toBeDefined();
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
    expect(store).toBeDefined();
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
    expect(store).toBeDefined();
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
    expect(store).toBeDefined();
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
    expect(store).toBeDefined();
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
    expect(store).toBeDefined();
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
    expect(store).toBeDefined();
  });

  it("parse returns raw string for invalid json", () => {
    localStorage.setItem("badparse", "{invalid");
    looseEqual(store.get("badparse"), "{invalid");
    store.remove("badparse");
    expect(store).toBeDefined();
  });

  it("namespace returns empty string on root store", () => {
    looseEqual(store.namespace(), "");
    expect(store).toBeDefined();
  });

  it("namespace returns current namespace when called without args", () => {
    const ns = store.namespace("named");
    looseEqual(ns.namespace(), "named");
    ns.clear();
    expect(store).toBeDefined();
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
    expect(store).toBeDefined();
  });

  it("isFake(false) is safe when storage was never forced fake", () => {
    looseEqual(store.isFake(false), store.isFake());
    expect(store).toBeDefined();
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
      seen.push(k);
      return k === "b" ? false : undefined;
    });
    expect(seen).toEqual(["a", "b"]);
  });

  it("set skips overwrite when overwrite is false and key exists", () => {
    store.set("keep", "original");
    looseEqual(store.set("keep", "new", false), "new");
    looseEqual(store.get("keep"), "original");
    store.remove("keep");
    expect(store).toBeDefined();
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
    expect(store).toBeDefined();
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
