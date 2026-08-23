/**
 * Copyright (c) 2026 Nathan Bubna
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Adds getters and setters for existing keys (and newly set() ones) to enable dot access to stored properties.
 *
 *   store.dot('foo','bar');// makes store aware of keys (could also do store.set('foo',''))
 *   store.foo = { is: true };// == store.set('foo', { is: true });
 *   console.log(store.foo.is);// logs 'true'
 *
 * This will not create accessors that conflict with existing properties of the store object.
 *
 * Status: DEPRECATED - proxy is better
 */
import store from "store2";
import type { DeveloperTools, ExtensionFn, StoreBase } from "../types";

export type DotNamespace = {
  define(target: StoreBase, key: string): void;
};

export type DotExtensions = {
  dot: ExtensionFn<string | string[] | undefined> & DotNamespace;
};

export type DotDeveloperTools = DeveloperTools & DotExtensions;

const _ = store._ as DotDeveloperTools;

_.dot = function (this: StoreBase, key?: string | string[]) {
  const keys = !key
      ? this.keys()
      : Array.isArray(key)
        ? key
        : (Array.prototype.slice.call(arguments) as string[]);
  keys.forEach((key: string) => {
    _.dot.define(this, key);
  });
  return this;
} as DotExtensions["dot"];

_.dot.define = function (target: StoreBase, key: string) {
  if (!(key in target)) {
    Object.defineProperty(target, key, {
      enumerable: true,
      get: function (this: StoreBase) {
        return this.get(key);
      },
      set: function (this: StoreBase, value: unknown) {
        this.set(key, value);
      },
    });
  }
};

_.fn("dot", _.dot as ExtensionFn);
