/**
 * Copyright (c) 2022, ESHA Research
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
import type {
  InternalSupport,
  StoreAPIInternal,
  StoreInternal,
} from "./internal";
import type { EachFn, Replacer, Reviver, StoredData, Store, StorageAPI, StorageLike, FakeStorage, FakeStorageCore, StoreAPI, StoreBase, TransactFn } from "./types";

export type * from "./types";

const safeStorage = (getStorage: () => Storage): Storage | undefined => {
  try {
    return getStorage();
  } catch {
    return undefined;
  }
};

const storageAPI: FakeStorage = {
  length: 0,
  name: "",
  items: {},
  has(k: string): boolean {
    return Object.hasOwn(this.items, k);
  },
  key(i: number): string | undefined {
    let c = 0;
    for (const k in this.items) {
      if (this.has(k) && i === c++) {
        return k;
      }
    }
  },
  setItem(k: string, v: string): void {
    if (!this.has(k)) {
      this.length++;
    }
    this.items[k] = v;
  },
  removeItem(k: string): void {
    if (this.has(k)) {
      delete this.items[k];
      this.length--;
    }
  },
  getItem(k: string): string | null {
    return this.has(k) ? this.items[k] : null;
  },
  clear(): void {
    for (const k in this.items) {
      this.removeItem(k);
    }
  },
};

const _: InternalSupport = {
  version: __STORE2_VERSION__,
  areas: {},
  apis: {},
  nsdelim: ".",

  inherit<S = StorageAPI | StoreAPIInternal, O = StoreBase | FakeStorageCore>(api: S, o: O): S & O {
    for (const p in api) {
      if (!Object.hasOwn(o as object, p)) {
        Object.defineProperty(o, p, Object.getOwnPropertyDescriptor(api, p)!);
      }
    }
    return o as unknown as S & O;
  },

  stringify: (d, fn) =>
    d === undefined || typeof d === "function" ? `${d}` : JSON.stringify(d, fn || _.replace),

  parse: (s, fn) => {
    try {
      return JSON.parse(s, fn || _.revive);
    } catch {
      return s;
    }
  },

  fn(name, fn) {
    (_.storeAPI as Record<string, unknown>)[name] = fn;
    for (const api in _.apis) {
      _.apis[api][name] = fn;
    }
  },

  get: (area, key) => area.getItem(key),
  set: (area, key, value) => {
    area.setItem(key, value);
  },
  remove: (area, key) => area.removeItem(key),
  key: (area, i) => area.key(i) ?? null,
  length: (area) => area.length,
  clear: (area) => area.clear(),

  Store(id, area, namespace = "") {
    const store: StoreAPIInternal & StoreBase = _.inherit<StoreAPIInternal, StoreBase>(
      _.storeAPI,
      function<T = unknown>(key?: string | number | Function | false, data?: T | TransactFn<T>, overwrite?: T | Reviver<T> | boolean | Replacer<T>): null | undefined | boolean | T | StoreBase | StoredData {
        if (arguments.length === 0) {
          return store.getAll();
        }
        if (typeof data === "function") {
          return store.transact(key as string, data as TransactFn<T>, overwrite as T | Reviver<T>);
        }
        if (data !== undefined) {
          return store.set(key as string, data, overwrite as boolean | Replacer<T>);
        }
        if (typeof key === "string" || typeof key === "number") {
          return store.get(String(key));
        }
        if (typeof key === "function") {
          return store.each(key as EachFn<unknown>);
        }
        if (!key) {
          return store.clear();
        }
        return store.setAll(key as StoredData);
      } as StoreBase,
    );

    store._id = id;
    try {
      const testKey = "__store2_test";
      area!.setItem(testKey, "ok");
      store._area = area!;
      area!.removeItem(testKey);
    } catch {
      store._area = _.storage("fake");
    }
    store._ns = namespace;
    if (!_.areas[id]) {
      _.areas[id] = store._area;
    }
    if (!_.apis[store._ns + store._id]) {
      _.apis[store._ns + store._id] = store;
    }
    return store;
  },

  storage: (name) => _.inherit(storageAPI, { items: {}, name }) as FakeStorage,

  storeAPI: {
    area(id: string, area?: StorageLike): StoreInternal {
      let store = this[id] as StoreInternal | undefined;
      if (!store || !store.area) {
        store = _.Store(id, area, this._ns);
        if (!this[id]) {
          this[id] = store;
        }
      }
      return store;
    },

    namespace(namespace?: string, singleArea?: boolean, delim?: string): StoreInternal {
      delim = delim || this._delim || _.nsdelim;
      if (!namespace) {
        return (this._ns
          ? this._ns.substring(0, this._ns.length - delim.length)
          : "") as unknown as StoreInternal;
      }
      const ns = namespace;
      let store = this[ns] as StoreInternal | undefined;
      if (!store || !store.namespace) {
        store = _.Store(this._id, this._area, this._ns + ns + delim);
        store._delim = delim;
        if (!this[ns]) {
          this[ns] = store;
        }
        if (!singleArea) {
          for (const name in _.areas) {
            store.area(name, _.areas[name]);
          }
        }
      }
      return store;
    },

    isFake(force?: boolean): boolean {
      if (force) {
        this._real = this._area;
        this._area = _.storage("fake");
      } else if (force === false) {
        this._area = this._real || this._area;
      }
      return this._area.name === "fake";
    },

    toString(): string {
      return `store${this._ns ? `.${this.namespace()}` : ""}[${this._id}]`;
    },

    has(key: string): boolean {
      if (this._area.has) {
        return this._area.has(this._in(key));
      }
      return !!(this._in(key) in this._area);
    },

    size(): number {
      return this.keys().length;
    },

    each(fn: EachFn, fill?: unknown): StoreInternal | unknown {
      for (let i = 0, m = _.length(this._area); i < m; i++) {
        const key = this._out(_.key(this._area, i) ?? undefined);
        if (key !== undefined) {
          if (fn.call(this, key, this.get(key), fill) === false) {
            break;
          }
        }
        if (m > _.length(this._area)) {
          m--;
          i--;
        }
      }
      return fill || this;
    },

    keys(fillList?: string[]): string[] {
      return this.each((k, _v, list) => {
        (list as string[]).push(k);
      }, fillList || []) as string[];
    },

    get(key: string, alt?: unknown | Reviver): unknown {
      let s = _.get(this._area, this._in(key));
      let fn: Reviver | undefined;
      if (typeof alt === "function") {
        fn = alt;
        alt = null;
      }
      return s !== null ? _.parse(s, fn) : alt != null ? alt : s;
    },

    getAll(fillObj?: StoredData): StoredData {
      return this.each((k, v, all) => {
        (all as StoredData)[k] = v;
      }, fillObj || {}) as StoredData;
    },

    transact(key: string, fn: (data: unknown) => unknown, alt?: unknown | Reviver): StoreInternal {
      const val = this.get(key, alt);
      const ret = fn(val);
      this.set(key, ret === undefined ? val : ret);
      return this;
    },

    set(key: string, data: unknown, overwrite?: boolean | Replacer): unknown {
      const d = this.get(key);
      let replacer: Replacer | undefined;
      if (d != null && overwrite === false) {
        return data;
      }
      if (typeof overwrite === "function") {
        replacer = overwrite;
        overwrite = undefined;
      }
      return _.set(this._area, this._in(key), _.stringify(data, replacer), overwrite) || d;
    },

    setAll(data: StoredData, overwrite?: boolean | Replacer): boolean | undefined {
      let changed: boolean | undefined;
      for (const key in data) {
        const val = data[key];
        if (this.set(key, val, overwrite) !== val) {
          changed = true;
        }
      }
      return changed;
    },

    add(key: string, data: unknown, replacer?: Replacer): unknown {
      let d = this.get(key);
      if (d instanceof Array) {
        data = d.concat(data);
      } else if (d !== null) {
        const type = typeof d;
        if (type === typeof data && type === "object") {
          for (const k in data as Record<string, unknown>) {
            (d as Record<string, unknown>)[k] = (data as Record<string, unknown>)[k];
          }
          data = d;
        } else {
          data = d + data;
        }
      }
      _.set(this._area, this._in(key), _.stringify(data, replacer));
      return data;
    },

    remove(key: string, alt?: unknown | Reviver): unknown {
      const d = this.get(key, alt);
      _.remove(this._area, this._in(key));
      return d;
    },

    clear(): StoreInternal {
      if (!this._ns) {
        _.clear(this._area);
      } else {
        this.each((k) => {
          _.remove(this._area, this._in(k));
        }, 1);
      }
      return this;
    },

    clearAll(): StoreInternal {
      const area = this._area;
      for (const id in _.areas) {
        if (_.areas.hasOwnProperty(id)) {
          this._area = _.areas[id];
          this.clear();
        }
      }
      this._area = area;
      return this;
    },

    _in(k: string | unknown): string {
      if (typeof k !== "string") {
        k = _.stringify(k);
      }
      return this._ns ? this._ns + k : (k as string);
    },

    _out(k: string | null | undefined): string | undefined {
      return this._ns
        ? k && k.indexOf(this._ns) === 0
          ? k.substring(this._ns.length)
          : undefined
        : k;
    },
  },

  storageAPI,
};

const store = _.Store(
  "local",
  safeStorage(() => localStorage),
);
store.local = store;
store._ = _;
store.area(
  "session",
  safeStorage(() => sessionStorage),
);
store.area("page", _.storage("page"));

if (typeof window !== "undefined") {
  if (window.store) {
    _.conflict = window.store;
  }
  window.store = store as unknown as Store;
}

export default store as Store;
