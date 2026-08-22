/**
 * Copyright (c) 2026 Nathan Bubna
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Makes it easy to watch for storage events by enhancing the events and
 * allowing binding to particular keys and/or namespaces.
 *
 * // listen to particular key storage events (yes, this is namespace sensitive)
 * store.on('foo', function listenToFoo(e){ console.log('foo was changed:', e); });
 * store.off('foo', listenToFoo);
 *
 * // listen to all storage events
 * store.on(function storageEvent(e){ console.log('web storage:', e); });
 * store.off(storageEvent);
 *
 * Status: DEPRECATED - on is better
 */
import store from "store2";
import type { DeveloperTools, ExtensionFn, StorageLike, StoreBase, StoreMetadata } from "../types";
import type { StoreAPIInternal } from "../internal";
import type { CacheExtensions } from "./cache";
import type { StorageEventInfo } from "./on";

export type BindExtensions = {
  id(area: StorageLike): string | undefined;
  event(k: string, s: StoreBase, e: StorageEvent): StorageEventInfo;
};

export type BindDeveloperTools = DeveloperTools &
  BindExtensions &
  Partial<Pick<CacheExtensions, "cache" | "expires" | "when">>;

type BindStore = StoreBase & StoreMetadata & Pick<StoreAPIInternal, "_out">;

type BindListener = ((e: StorageEventInfo | Event) => unknown) & Record<string, EventListener>;

const _ = store._ as BindDeveloperTools;

_.fn("on", function (this: StoreBase, key: string | BindListener, fn?: BindListener) {
  if (!fn) {
    fn = key as BindListener;
    key = "";
  }
  const s = this as BindStore,
    id = _.id((this as BindStore)._area);
  let bound: EventListener;
  if (window.addEventListener) {
    bound = function (e: StorageEvent) {
      const k = s._out(e.key);
      if (k && (!key || k === key)) {
        const eid = _.id(e.storageArea as StorageLike);
        if (!eid || id === eid) {
          fn!.call(s, _.event(k, s, e));
        }
      }
    } as EventListener;
    window.addEventListener("storage", bound, false);
  } else {
    (document as Document & { attachEvent: (type: string, fn: EventListener) => void }).attachEvent(
      "onstorage",
      (bound = function () {
        return fn!.call(s, window.event as Event);
      }),
    );
  }
  fn!["_" + key + "listener"] = bound;
  return this;
} as ExtensionFn);

_.fn("off", function (this: StoreBase, key: string | BindListener, fn?: BindListener) {
  if (!fn) {
    fn = key as BindListener;
    key = "";
  }
  const bound = fn!["_" + key + "listener"];
  if (window.removeEventListener) {
    window.removeEventListener("storage", bound);
  } else {
    (document as Document & { detachEvent: (type: string, fn: EventListener) => void }).detachEvent(
      "onstorage",
      bound,
    );
  }
  return this;
} as ExtensionFn);

_.event = function (k: string, s: StoreBase, e: StorageEvent) {
  const event: StorageEventInfo = {
    key: k,
    namespace: s.namespace(),
    newValue: _.parse(e.newValue ?? ""),
    oldValue: _.parse(e.oldValue ?? ""),
    url: (e as StorageEvent & { uri?: string }).url || (e as StorageEvent & { uri?: string }).uri,
    storageArea: e.storageArea ?? undefined,
    source: (e as StorageEvent & { source?: unknown }).source,
    timeStamp: e.timeStamp,
    originalEvent: e,
  };
  if (_.cache) {
    const min = _.expires!((e.newValue || e.oldValue) ?? "");
    if (min) {
      event.expires = _.when!(min);
    }
  }
  return event;
};

_.id = function (area: StorageLike) {
  for (const id in _.areas) {
    if (area === _.areas[id]) {
      return id;
    }
  }
};
