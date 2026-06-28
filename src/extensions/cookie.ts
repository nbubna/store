/**
 * Copyright (c) 2026 Nathan Bubna
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Creates a store area that uses a single cookie as the backing storage.
 * This gives you the store API for a specific 'store' cookie that your backend
 * can access too. It could definitely use more testing.
 *
 * Status: USEFUL - unsupported, useful, needs testing
 */
import store from "store2";
import type { DeveloperTools, StorageAPI, StorageLike } from "../types";

export type CookieState = Record<string, string>;

export type CookieHelper = {
  name: string;
  maxAge: number;
  suffix: string;
  encode(state: CookieState): string;
  decode(state: string): CookieState;
  all(): CookieState;
  read(name?: string): CookieState | null;
  write(state: CookieState, name?: string): void;
  remove(name?: string): void;
  area: StorageAPI;
};

export type CookieDeveloperTools = DeveloperTools & { cookie: CookieHelper };

const _ = store._ as CookieDeveloperTools;

const C: CookieHelper = (_.cookie = {
  name: "store",
  maxAge: 60 * 60 * 24 * 365 * 10,
  suffix: ";path=/;sameSite=strict",
  encode: function (state: CookieState) {
    return encodeURIComponent(JSON.stringify(state));
  },
  decode: function (state: string) {
    return JSON.parse(decodeURIComponent(state));
  },
  all: function () {
    return C.read(C.name) || {};
  },
  read: function (name?: string) {
    const match = document.cookie.match(new RegExp("(^| )" + (name || C.name) + "=([^;]+)"));
    return match ? C.decode(match[2]) : null;
  },
  write: function (state: CookieState, name?: string) {
    document.cookie = (name || C.name) + "=" + C.encode(state) + ";max-age=" + C.maxAge + C.suffix;
  },
  remove: function (name?: string) {
    document.cookie =
      (name || C.name) + "=;expires=Thu, 01 Jan 1970 00:00:01 GMT" + C.suffix;
  },
  area: {} as StorageAPI,
});

C.area = {
  key: function (i: number) {
    let c = 0,
      state = C.all();
    for (const k in state) {
      if (Object.hasOwn(state, k) && i === c++) {
        return k;
      }
    }
  },
  setItem: function (k: string, v: string) {
    const state = C.all();
    state[k] = v;
    C.write(state);
  },
  getItem: function (k: string) {
    const state = C.all();
    return Object.hasOwn(state, k) ? state[k] : null;
  },
  has: function (k: string) {
    return Object.hasOwn(C.all(), k);
  },
  removeItem: function (k: string) {
    const state = C.read(C.name);
    if (state) {
      delete state[k];
      C.write(state);
    }
  },
  clear: C.remove,
  length: 0,
};

Object.defineProperty(C.area, "length", {
  get: function () {
    let ln = 0,
      state = C.all();
    for (const k in state) {
      if (Object.hasOwn(state, k)) {
        ln++;
      }
    }
    return ln;
  },
});

(store.area as (id: string, area?: StorageLike) => typeof store).call(store, "cookie", C.area as StorageLike);
