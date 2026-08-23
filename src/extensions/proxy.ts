/**
 * Copyright (c) 2026 Nathan Bubna
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Wraps store instances in a Proxy so stored keys are readable and writable as
 * properties. Stored objects and arrays are wrapped recursively so nested mutations
 * persist the root value again.
 *
 *   import store from "store2/proxy";
 *   store.greeting = "hello";
 *   store.profile.name = "Ada";
 *   console.log('greeting' in store);// logs true
 *   console.log(store.get('profile').name);// logs 'Ada'
 *   delete store.greeting;
 *   store.items = ["a", "b"];
 *   store.items.push("c");
 *   console.log(store.items);// logs ['a', 'b', 'c']
 *
 * NOTE: Existing store API names always take precedence over stored keys.
 *
 * Status: USEFUL
 */
import store from "store2";
import type { DeveloperTools, Store, StoreBase, StorageLike } from "../types";

export type ProxyExtensions = {
  wrapStore(target: StoreBase): Store;
  wrapData(store: StoreBase, key: string, value: unknown): unknown;
};

export type ProxyDeveloperTools = DeveloperTools & ProxyExtensions;

type DataContext = {
  store: StoreBase;
  key: string;
  root: unknown;
};

const _ = store._ as ProxyDeveloperTools;

const proxied = new WeakMap<object, Store>();
const dataProxied = new WeakMap<object, unknown>();

const mutatingArrayMethods = new Set([
  "copyWithin",
  "fill",
  "pop",
  "push",
  "reverse",
  "shift",
  "sort",
  "splice",
  "unshift",
]);

function isStorageKey(target: StoreBase, prop: string | symbol): prop is string {
  return typeof prop === "string" && !(prop in target);
}

function shouldWrapStore(value: unknown, target: StoreBase): value is StoreBase {
  return (
    typeof value === "function" &&
    value !== target &&
    typeof (value as StoreBase).get === "function" &&
    typeof (value as StoreBase).set === "function"
  );
}

function isPlainObject(value: object): boolean {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function shouldWrapData(value: unknown): value is object {
  if (value === null || typeof value !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return true;
  }
  return isPlainObject(value);
}

function commit(ctx: DataContext): void {
  ctx.store.set(ctx.key, ctx.root);
}

function wrapDataValue(value: unknown, ctx: DataContext): unknown {
  if (!shouldWrapData(value)) {
    return value;
  }

  const cached = dataProxied.get(value);
  if (cached) {
    return cached;
  }

  const proxy = Array.isArray(value)
    ? new Proxy(value, createArrayHandler(ctx))
    : new Proxy(value, createObjectHandler(ctx));
  dataProxied.set(value, proxy);
  return proxy;
}

function createObjectHandler(ctx: DataContext): ProxyHandler<object> {
  return {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      return wrapDataValue(value, ctx);
    },
    set(target, prop, value, receiver) {
      const ok = Reflect.set(target, prop, value, receiver);
      commit(ctx);
      return ok;
    },
    deleteProperty(target, prop) {
      const ok = Reflect.deleteProperty(target, prop);
      commit(ctx);
      return ok;
    },
  };
}

function createArrayHandler(ctx: DataContext): ProxyHandler<unknown[]> {
  return {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (
        typeof prop === "string" &&
        mutatingArrayMethods.has(prop) &&
        typeof value === "function"
      ) {
        return (...args: unknown[]) => {
          const result = Reflect.apply(value, target, args);
          commit(ctx);
          return result;
        };
      }
      return wrapDataValue(value, ctx);
    },
    set(target, prop, value, receiver) {
      const ok = Reflect.set(target, prop, value, receiver);
      commit(ctx);
      return ok;
    },
    deleteProperty(target, prop) {
      const ok = Reflect.deleteProperty(target, prop);
      commit(ctx);
      return ok;
    },
  };
}

_.wrapData = function (targetStore: StoreBase, key: string, value: unknown): unknown {
  if (!shouldWrapData(value)) {
    return value;
  }
  return wrapDataValue(value, { store: targetStore, key, root: value });
};

const storeProxyHandler: ProxyHandler<StoreBase> = {
  get(target, prop, receiver) {
    if (isStorageKey(target, prop)) {
      const value = target.get(prop);
      return _.wrapData(target, prop, value);
    }
    const value = Reflect.get(target, prop, receiver);
    if (value === target) {
      return receiver;
    }
    if (shouldWrapStore(value, target)) {
      return _.wrapStore(value);
    }
    return value;
  },
  set(target, prop, value, receiver) {
    if (isStorageKey(target, prop)) {
      target.set(prop, value);
      return true;
    }
    return Reflect.set(target, prop, value, receiver);
  },
  has(target, prop) {
    if (isStorageKey(target, prop)) {
      return target.has(prop);
    }
    return Reflect.has(target, prop);
  },
  deleteProperty(target, prop) {
    if (isStorageKey(target, prop)) {
      target.remove(prop);
      return true;
    }
    return Reflect.deleteProperty(target, prop);
  },
  apply(target, thisArg, args) {
    return Reflect.apply(target, thisArg as StoreBase, args);
  },
};

_.wrapStore = function (target: StoreBase): Store {
  let proxy = proxied.get(target);
  if (!proxy) {
    proxy = new Proxy(target, storeProxyHandler) as Store;
    proxied.set(target, proxy);
  }
  return proxy;
};

const createStore = _.Store as (
  id: string,
  area: StorageLike | undefined,
  namespace?: string,
) => StoreBase;

_.Store = function (id, area, namespace) {
  return _.wrapStore(createStore(id, area, namespace));
} as DeveloperTools["Store"];

const proxiedStore = _.wrapStore(store);

if (typeof window !== "undefined") {
  window.store = proxiedStore;
}

export default proxiedStore;
