/**
 * Copyright (c) 2026 Nathan Bubna
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * When quota is reached on a storage area, this shifts incoming values to
 * fake storage, so they last only as long as the page does. This is useful
 * because it is more burdensome for localStorage to recover from quota errors
 * than incomplete caches. In other words, it is wiser to rely on store.js
 * never complaining than never missing data. You should already be checking
 * the integrity of cached data on every page load.
 *
 * Status: USEFUL
 */
import store from "store2";
import type { DeveloperTools, StorageLike, StoreMetadata } from "../types";
import type { InternalSupport } from "../internal";

export type OverflowExtensions = {
  overflow(area: StorageLike, create?: boolean): StorageLike | undefined;
};

export type OverflowDeveloperTools = DeveloperTools & OverflowExtensions & InternalSupport;

const _ = store._ as unknown as OverflowDeveloperTools;
const areas = (_ as InternalSupport).areas;

const _set = _.set,
  _get = _.get,
  _remove = _.remove,
  _key = _.key,
  _length = _.length,
  _clear = _.clear;

function isQuotaError(e: unknown): boolean {
  if (typeof e !== "object" || e === null) { return false; }
  const err = e as { name?: string; toString?: () => string };
  return (
    err.name === "QUOTA_EXCEEDED_ERR" ||
    err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    err.toString?.().indexOf("QUOTA_EXCEEDED_ERR") !== -1 ||
    err.toString?.().indexOf("QuotaExceededError") !== -1
  );
}

_.overflow = function (area: StorageLike, create?: boolean) {
  const name = area === areas.local ? "+local+" : area === areas.session ? "+session+" : false;
  if (name) {
    let overflow = areas[name];
    if (create && !overflow) {
      overflow = (store.area(name) as unknown as StoreMetadata)._area;
    } else if (create === false) {
      delete areas[name];
      delete (store as unknown as Record<string, unknown>)[name];
    }
    return overflow;
  }
  return undefined;
};

_.set = function (area: StorageLike, key: string, string: string, ...rest: unknown[]) {
  try {
    _set(area, key, string, ...rest);
    return undefined;
  } catch (e) {
    if (isQuotaError(e)) {
      return _.set(_.overflow(area, true)!, key, string, ...rest);
    }
    throw e;
  }
};

_.get = function (area: StorageLike, key: string) {
  const overflow = _.overflow(area);
  return (overflow && _get.call(this, overflow, key)) || _get(area, key);
};

_.remove = function (area: StorageLike, key: string) {
  const overflow = _.overflow(area);
  if (overflow) {
    _remove.call(this, overflow, key);
  }
  _remove(area, key);
};

_.key = function (area: StorageLike, i: number) {
  const overflow = _.overflow(area);
  if (overflow) {
    const l = _length.call(this, area);
    if (i >= l) {
      i = i - l;
      for (let j = 0, m = _length.call(this, overflow); j < m; j++) {
        if (j === i) {
          return _key.call(this, overflow, j);
        }
      }
    }
  }
  return _key(area, i);
};

_.length = function (area: StorageLike) {
  const length = _length(area),
    overflow = _.overflow(area);
  return overflow ? length + _length(overflow) : length;
};

_.clear = function (area: StorageLike) {
  _.overflow(area, false);
  _clear(area);
};
