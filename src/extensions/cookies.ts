/**
 * Copyright (c) 2026 Nathan Bubna
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Creates a store area that uses separate cookies for each key/value as the backing
 * storage. This effectively gives you the store API for all cookies..
 * It could definitely use more testing. It also feels like it should better
 * integrated with the expire plugin before we call it BETA.
 *
 * Status: EXPERIMENTAL - unsupported, useful, needs testing
 */
import store from "store2";
import type { DeveloperTools, StorageAPI, StorageLike } from "../types";

export type CookieMap = Record<string, string>;

export type CookiesHelper = {
  maxAge: number;
  suffix: string;
  all(): CookieMap;
  read(key: string): string | null;
  write(key: string, value: string): void;
  remove(key: string): void;
  area: StorageAPI;
};

export type CookiesDeveloperTools = DeveloperTools & { cookies: CookiesHelper };

const _ = store._ as CookiesDeveloperTools;

const C: CookiesHelper = (_.cookies = {
  maxAge: 60 * 60 * 24 * 365 * 10,
  suffix: ";path=/;sameSite=strict",
  all: function () {
    if (!document.cookie) {
      return {};
    }
    const cookies = document.cookie.split("; "),
      all: CookieMap = {};
    for (let i = 0, cookie, eq; i < cookies.length; i++) {
      cookie = cookies[i];
      eq = cookie.indexOf("=");
      all[cookie.substring(0, eq)] = decodeURIComponent(cookie.substring(eq + 1));
    }
    return all;
  },
  read: function (key: string) {
    const match = document.cookie.match(new RegExp("(^| )" + key + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  },
  write: function (key: string, value: string) {
    document.cookie = key + "=" + encodeURIComponent(value) + ";max-age=" + C.maxAge + C.suffix;
  },
  remove: function (key: string) {
    document.cookie = key + "=;expires=Thu, 01 Jan 1970 00:00:01 GMT" + C.suffix;
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
  setItem: (key: string, value: string) => C.write(key, value),
  getItem: (key: string) => C.read(key),
  has: function (k: string) {
    return Object.hasOwn(C.all(), k);
  },
  removeItem: (key: string) => C.remove(key),
  clear: function () {
    const state = C.all();
    for (const k in state) {
      C.remove(k);
    }
  },
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

if (typeof document !== "undefined") {
  (store.area as (id: string, area?: StorageLike) => typeof store).call(
    store,
    "cookies",
    C.area as StorageLike,
  );
}
