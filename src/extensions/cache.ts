/**
 * Copyright (c) 2026 Nathan Bubna
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Allows use of a number as 'overwrite' param on set calls to give time in seconds after
 * which the value should not be retrievable again (an expiration time).
 *
 * Status: USEFUL - useful, needs testing
 */
import store from "store2";
import type { DeveloperTools, Reviver, StorageLike } from "../types";
import type { InternalSupport } from "../internal";

export type CacheExtensions = {
  expires(s: string): number | false;
  when(sec?: number): Date | number;
  cache(area: StorageLike, key: string): string | null | undefined;
};

export type CacheDeveloperTools = DeveloperTools & CacheExtensions & InternalSupport;

const _ = store._ as CacheDeveloperTools;

const prefix = "exp@",
  suffix = ";",
  parse = _.parse,
  _get = _.get,
  _set = _.set;

_.parse = function (s: string, fn?: Reviver) {
  if (s && s.indexOf(prefix) === 0) {
    s = s.substring(s.indexOf(suffix) + 1);
  }
  return parse(s, fn);
} as InternalSupport["parse"];

_.expires = function (s: string) {
  if (s && s.indexOf(prefix) === 0) {
    return parseInt(s.substring(prefix.length, s.indexOf(suffix)), 10);
  }
  return false;
};

_.when = function (sec?: number) {
  const now = Math.floor(new Date().getTime() / 1000);
  return sec ? new Date((now + sec) * 1000) : now;
};

_.cache = function (area: StorageLike, key: string) {
  const s = _get(area, key),
    sec = _.expires(s ?? "");
  if (sec && (_.when() as number) >= sec) {
    area.removeItem(key);
    return undefined;
  }
  return s;
};

_.get = function (area: StorageLike, key: string) {
  const s = _.cache(area, key);
  return s === undefined ? null : s;
};

_.set = function (area: StorageLike, key: string, string: string, sec?: unknown) {
  try {
    if (sec) {
      string = prefix + ((_.when() as number) + (sec as number)) + suffix + string;
    }
    _set(area, key, string);
  } catch (e) {
    const err = e as { name?: string };
    if (err.name === "QUOTA_EXCEEDED_ERR" || err.name === "NS_ERROR_DOM_QUOTA_REACHED") {
      let changed = false;
      for (let i = 0, m = area.length; i < m; i++) {
        if (_.cache(area, key) === undefined) {
          changed = true;
        }
      }
      if (changed) {
        return _.set(area, key, string, sec);
      }
    }
    throw e;
  }
  return undefined;
};
