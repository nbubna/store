/**
 * Copyright (c) 2026 Nathan Bubna
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * store.remainingSpace();// returns remainingSpace value (if browser supports it)
 * store.charsUsed();// returns length of all data when stringified
 * store.charsLeft([true]);// tests how many more chars we can fit (crash threat!)
 * store.charsTotal([true]);// charsUsed + charsLeft, duh.
 *
 * TODO: byte/string conversions
 *
 * Status: EXPERIMENTAL - changing API *and* crash threats :)
 */
import store from "store2";
import type { DeveloperTools, StorageLike, StoreBase, StoreMetadata } from "../types";
import type { InternalSupport } from "../internal";

export type MeasureStore = StoreBase & {
  remainingSpace(): number | undefined;
  charsUsed(): number;
  charsLeft(test?: boolean): number | undefined;
  charsTotal(test?: boolean): number | undefined;
};

export type MeasureDeveloperTools = DeveloperTools & InternalSupport;

const _ = store._ as MeasureDeveloperTools;

function put(area: StorageLike, s: string): boolean {
  try {
    area.setItem("__test__", s);
    return true;
  } catch {
    return false;
  }
}

_.fn("remainingSpace", function (this: StoreBase) {
  const area = (this as StoreMetadata)._area as StorageLike & { remainingSpace?: number };
  return area.remainingSpace;
});

_.fn("charsUsed", function (this: StoreBase) {
  return _.stringify(this.getAll()).length - 2;
});

_.fn("charsLeft", function (this: StoreBase, test?: boolean): number | undefined {
  if (this.isFake()) {
    return;
  }
  if (arguments.length === 0) {
    test = window.confirm("Calling store.charsLeft() may crash some browsers!");
  }
  if (test) {
    let s = "s ",
      add = s;
    while (put(store._area, s)) {
      s += add;
      if (add.length < 50000) {
        add = s;
      }
    }
    while (add.length > 2) {
      s = s.substring(0, s.length - add.length / 2);
      while (put(store._area, s)) {
        s += add;
      }
      add = add.substring(add.length / 2);
    }
    _.remove(store._area, "__test__");
    return s.length + 8;
  }
  return undefined;
});

_.fn("charsTotal", function (this: StoreBase, test?: boolean) {
  return (this as MeasureStore).charsUsed() + (this as MeasureStore).charsLeft(test)!;
});
