/**
 * Copyright (c) 2026 Nathan Bubna
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * If fake (non-persistent) storage for users stuck in the dark ages
 * does not satisfy you, this will replace it with the a reasonable imitator for their
 * pathetic, incompetent browser.  Note that the session replacement here is potentially
 * insecure as it uses window.name without any fancy protections.
 *
 * Status: USEFUL - unsupported, useful, needs testing & refining
 */
import store from "store2";
import type { FakeStorage, StorageLike, Store, StoreMetadata } from "../types";
import type { InternalSupport } from "../internal";

type StorageRecord = Record<string, string>;

type IEUserDataElement = HTMLDivElement & {
  addBehavior(behavior: string): void;
  load(storeName: string): void;
  save(storeName: string): void;
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  XMLDocument: { documentElement: { attributes: { name: string }[]; length: number } };
};

const _ = store._ as unknown as InternalSupport;

function addUpdateFn(
  area: Record<string, unknown>,
  name: string,
  update: (...args: unknown[]) => void,
) {
  const old = area[name] as (...args: unknown[]) => unknown;
  area[name] = function (this: unknown) {
    const ret = old.apply(this, arguments as unknown as []);
    update.apply(this, arguments as unknown as []);
    return ret;
  };
}

function create(
  name: string,
  items: StorageRecord,
  update?: (...args: unknown[]) => void,
): FakeStorage {
  let length = 0;
  for (const k in items) {
    if (Object.hasOwn(items, k)) {
      length++;
    }
  }
  const area = _.inherit(_.storageAPI, { items, length, name }) as FakeStorage;
  if (update) {
    addUpdateFn(area as unknown as Record<string, unknown>, "setItem", update);
    addUpdateFn(area as unknown as Record<string, unknown>, "removeItem", update);
  }
  return area;
}

if (store.isFake()) {
  let area: StorageLike;

  if (
    (document.documentElement as HTMLElement & { addBehavior?: (b: string) => void }).addBehavior
  ) {
    const el = document.createElement("div") as IEUserDataElement,
      sn = "localStorage",
      body = document.body,
      wrap = function wrap(fn: (...args: unknown[]) => unknown) {
        return function (this: unknown) {
          body.appendChild(el);
          el.addBehavior("#default#userData");
          el.load(sn);
          const ret = fn.apply(store._area, arguments as unknown as []);
          el.save(sn);
          body.removeChild(el);
          return ret;
        };
      },
      has = function has(key: string) {
        return el.getAttribute(key) !== null;
      },
      UserDataStorage = function UserDataStorage(this: FakeStorage) {
        return this;
      } as unknown as { new (): FakeStorage };

    UserDataStorage.prototype = {
      length: wrap(function () {
        return el.XMLDocument.documentElement.attributes.length;
      })(),
      has: wrap(has as (...args: unknown[]) => unknown),
      key: wrap(function (i: number) {
        return el.XMLDocument.documentElement.attributes[i]?.name;
      } as (...args: unknown[]) => unknown),
      setItem: wrap(function (this: FakeStorage, k: string, v: string) {
        if (!has(k)) {
          this.length++;
        }
        el.setAttribute(k, v);
      } as (...args: unknown[]) => unknown),
      removeItem: wrap(function (this: FakeStorage, k: string) {
        if (has(k)) {
          el.removeAttribute(k);
          this.length--;
        }
      } as (...args: unknown[]) => unknown),
      getItem: wrap(function (k: string) {
        return el.getAttribute(k);
      } as (...args: unknown[]) => unknown),
      clear: wrap(function (this: FakeStorage) {
        const all = el.XMLDocument.documentElement.attributes;
        for (let i = 0, a; !!(a = all[i]); i++) {
          el.removeAttribute(a.name);
        }
        this.length = 0;
      }),
    } as unknown as FakeStorage;
    area = new UserDataStorage();
  } else if (
    "globalStorage" in window &&
    (window as Window & { globalStorage?: Record<string, StorageRecord> }).globalStorage
  ) {
    area = create(
      "global",
      (window as Window & { globalStorage: Record<string, StorageRecord> }).globalStorage[
        window.location.hostname
      ],
    );
  } else {
    const date = new Date();
    const key = "store.local";
    let items: StorageRecord = {};
    const cookies = document.cookie.split(";");
    date.setTime(date.getTime() + 5 * 365 * 24 * 60 * 60 * 1000);
    const expires = date.toUTCString();
    for (let i = 0, m = cookies.length; i < m; i++) {
      let c = cookies[i];
      while (c.charAt(0) === " ") {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(key) === 0) {
        items = JSON.parse(c.substring(key.length + 1)) as StorageRecord;
      }
    }
    area = create("cookie", items, function (this: FakeStorage) {
      document.cookie =
        key + "=" + JSON.stringify(this.items) + "; expires=" + expires + "; path=/";
    });
  }

  store._area = _.areas.local = area;
}

if (store.session.isFake()) {
  const domain = document.domain;
  const parsed = window.name ? (JSON.parse(window.name) as Record<string, StorageRecord>) : {};
  const sItems = parsed[domain] || {};
  (store.session as unknown as StoreMetadata)._area = _.areas.session = create(
    "windowName",
    sItems,
    function (this: FakeStorage) {
      const o: Record<string, StorageRecord> = {};
      o[domain] = this.items;
      window.name = JSON.stringify(o);
    },
  );
}
