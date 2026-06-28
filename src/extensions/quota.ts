/**
 * Copyright (c) 2026 Nathan Bubna
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Bind handlers to quota errors:
 *   store.quota(function(e, area, key, str) {
 *      console.log(e, area, key, str);
 *   });
 * If a handler returns true other handlers are not called and
 * the error is suppressed.
 *
 * Think quota errors will never happen to you? Think again:
 * http://spin.atomicobject.com/2013/01/23/ios-private-browsing-localstorage/
 * (this affects sessionStorage too)
 *
 * Status: EXPERIMENTAL - API could use unbind feature
 */
import store from "store2";
import type { StorageLike, Store } from "../types";
import type { InternalSupport } from "../internal";

export type QuotaHandler = (
  this: InternalSupport,
  e: unknown,
  area: StorageLike,
  key: string,
  str: string,
) => boolean | void;

export type QuotaFn = ((fn: QuotaHandler) => void) & { fns: QuotaHandler[] };

export type QuotaStore = Store & { quota: QuotaFn };

const quotaStore = store as QuotaStore;
const _ = store._ as unknown as InternalSupport;

function quotaFn(fn: QuotaHandler) {
  quotaStore.quota.fns.push(fn);
}
quotaFn.fns = [] as QuotaHandler[];
quotaStore.quota = quotaFn as QuotaFn;

const _set = _.set;
_.set = function (area: StorageLike, key: string, str: string, ...rest: unknown[]) {
  try {
    _set(area, key, str, ...rest);
  } catch (e) {
    const err = e as { name?: string };
    if (err.name === "QUOTA_EXCEEDED_ERR" || err.name === "NS_ERROR_DOM_QUOTA_REACHED") {
      const fns = quotaStore.quota.fns;
      for (let i = 0, m = fns.length; i < m; i++) {
        if (true === fns[i].call(this, e, area, key, str)) {
          return;
        }
      }
    }
    throw e;
  }
};
