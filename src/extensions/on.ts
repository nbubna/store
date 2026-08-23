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
 * // listen to all storage events (also namespace sensitive)
 * store.on(function storageEvent(e){ console.log('web storage:', e); });
 * store.off(storageEvent);
 *
 * Status: USEFUL - useful, if you aren't using IE8 or worse
 */
import store from "store2";
import type { DeveloperTools, ExtensionFn, StorageLike, StoreBase, StoreMetadata } from "../types";
import type { StoreAPIInternal } from "../internal";
import type { CacheExtensions } from "./cache";

export type StorageEventInfo = {
  key: string;
  namespace: string;
  newValue: unknown;
  oldValue: unknown;
  url?: string;
  storageArea?: StorageLike;
  source?: unknown;
  timeStamp?: number;
  originalEvent: StorageEvent;
  expires?: Date | number;
};

type OnListener = ((e: StorageEventInfo) => unknown) & Record<string, EventListener>;

export type OnExtensions = {
  on(this: StoreBase, key: string, fn: OnListener): StoreBase;
  on(this: StoreBase, fn: OnListener): StoreBase;
  off(this: StoreBase, key: string, fn: OnListener): StoreBase;
  off(this: StoreBase, fn: OnListener): StoreBase;
  once(this: StoreBase, key: string, fn: OnListener): StoreBase;
  once(this: StoreBase, fn: OnListener): StoreBase;
  event(this: StoreBase, k: string, e: StorageEvent): StorageEventInfo;
};

export type OnDeveloperTools = DeveloperTools &
  OnExtensions &
  Partial<Pick<CacheExtensions, "cache" | "expires" | "when">>;

type OnStore = StoreBase & StoreMetadata & Pick<StoreAPIInternal, "_out">;

type OnBoundStore = OnStore & Pick<OnExtensions, "on" | "off">;

const _ = store._ as OnDeveloperTools;

_.on = function (this: StoreBase, key: string | OnListener, fn?: OnListener) {
  if (!fn) {
    fn = key as OnListener;
    key = "";
  }
  const s = this as OnStore,
    listener = function (e: StorageEvent) {
      const k = s._out(e.key);
      if (
        k &&
        (k === key || (!key && k !== "_-bad-_")) &&
        (!e.storageArea || e.storageArea === s._area)
      ) {
        return fn!.call(s, _.event.call(s, k, e));
      }
    };
  window.addEventListener(
    "storage",
    (fn![(key as string) + "-listener"] = listener as EventListener),
    false,
  );
  return this;
};

_.off = function (this: StoreBase, key: string | OnListener, fn?: OnListener) {
  if (!fn) {
    fn = key as OnListener;
    key = "";
  }
  window.removeEventListener("storage", fn![(key as string) + "-listener"]);
  return this;
};

_.once = function (this: StoreBase, key: string | OnListener, fn?: OnListener) {
  if (!fn) {
    fn = key as OnListener;
    key = "";
  }
  const s = this as OnBoundStore;
  let listener: OnListener = function (this: StoreBase, ...args: unknown[]) {
    s.off(key as string, listener);
    return fn!.apply(this, args as [StorageEventInfo]);
  } 
  return s.on(key as string, listener);
};

_.event = function (this: StoreBase, k: string, e: StorageEvent) {
  const event: StorageEventInfo = {
    key: k,
    namespace: this.namespace(),
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

const old = window?.addEventListener ? null : function () {};
_.fn("on", (old ?? _.on) as ExtensionFn);
_.fn("off", (old ?? _.off) as ExtensionFn);
_.fn("once", (old ?? _.once) as ExtensionFn);
