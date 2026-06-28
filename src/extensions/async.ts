/**
 * Copyright (c) 2026 Nathan Bubna
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Adds an 'async' duplicate on all store APIs that
 * performs storage-related operations asynchronously and returns
 * a promise.
 *
 * Status: USEFUL - works great, but lacks justification for existence
 */
import store from "store2";
import type { DeveloperTools, StoreBase, StoreMetadata } from "../types";

const dontPromisify = ["async", "area", "namespace", "isFake", "toString"];

type PromisifySource = StoreBase &
  Pick<StoreMetadata, "_id" | "_area" | "_ns"> & {
    async?: AsyncStore;
  };

export type AsyncStore = PromisifySource & {
  async: AsyncStore;
  _async: true;
};

export type AsyncExtensions = {
  promisify(api: PromisifySource): AsyncStore;
  promiseFn(
    _name: string,
    fn: (...args: unknown[]) => unknown,
    self: StoreBase,
  ): (...args: unknown[]) => Promise<unknown>;
};

export type AsyncDeveloperTools = DeveloperTools & AsyncExtensions;

const _ = store._ as AsyncDeveloperTools;

const createStore = _.Store as (
  id: string,
  area: StoreMetadata["_area"] | undefined,
  namespace?: string,
) => StoreBase;

_.promisify = function (api: PromisifySource): AsyncStore {
  const async = createStore(api._id, api._area, api._ns) as AsyncStore;
  api.async = async;
  async._async = true;
  Object.keys(api).forEach((name: string) => {
    if (name.charAt(0) !== "_" && dontPromisify.indexOf(name) < 0) {
      const fn = (api as unknown as Record<string, unknown>)[name];
      if (typeof fn === "function") {
        (async as unknown as Record<string, unknown>)[name] = _.promiseFn(
          name,
          fn as (...args: unknown[]) => unknown,
          api,
        );
      }
    }
  });
  return async;
};

_.promiseFn = function (
  _name: string,
  fn: (...args: unknown[]) => unknown,
  self: StoreBase,
): (...args: unknown[]) => Promise<unknown> {
  return function promised(...args: unknown[]) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        try {
          resolve(fn.apply(self, args));
        } catch (e) {
          reject(e);
        }
      }, 0);
    });
  };
};

// promisify existing apis
for (const apiName in _.apis) {
  _.promisify(_.apis[apiName] as PromisifySource);
}

// ensure future apis are promisified
Object.defineProperty(_.storeAPI, "async", {
  enumerable: true,
  configurable: true,
  get: function (this: PromisifySource) {
    const asyncStore = _.promisify(this);
    Object.defineProperty(this, "async", {
      enumerable: true,
      value: asyncStore,
    });
    return asyncStore;
  },
});
