/**
 * Copyright (c) 2026 Nathan Bubna
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Allows retrieval of values from within a stored object.
 *
 *   store.set('foo', { is: { not: { quite: false }}});
 *   console.log(store.get('foo.is.not.quite'));// logs false
 *
 * Status: EXPERIMENTAL - currently only supports get
 */
import store from "store2";
import type { DeveloperTools, StorageLike } from "../types";
import type { InternalSupport } from "../internal";

export type DeepExtensions = {
  resolvePath(obj: unknown, path: string): unknown;
  split(key: string): [string, string] | undefined;
};

export type DeepDeveloperTools = DeveloperTools & DeepExtensions & InternalSupport;

type DeepGet = (area: StorageLike, key: string, kid?: string) => string | null;

const _ = store._ as DeepDeveloperTools;

const _get = _.get as DeepGet;

_.get = function (area: StorageLike, key: string, kid?: string) {
  let s = _get(area, key);
  if (s === null || s === undefined) {
    const parts = _.split(key);
    if (parts) {
      key = parts[0];
      kid = kid ? parts[1] + "." + kid : parts[1];
      return (_.get as DeepGet)(area, parts[0], kid);
    }
  } else if (kid) {
    try {
      let val = _.parse(s);
      val = _.resolvePath(val, kid);
      s = _.stringify(val);
    } catch (e) {
      window.console.error("Error accessing nested property:", e);
      return null;
    }
  }
  return s;
};

_.resolvePath = function (obj: unknown, path: string) {
  return path.split(".").reduce(function (acc: unknown, key: string) {
    return acc && typeof acc === "object" && acc !== null
      ? (acc as Record<string, unknown>)[key]
      : undefined;
  }, obj);
};

_.split = function (key: string) {
  const dot = key.lastIndexOf(".");
  if (dot > 0) {
    const kid = key.substring(dot + 1, key.length);
    key = key.substring(0, dot);
    return [key, kid];
  }
};
