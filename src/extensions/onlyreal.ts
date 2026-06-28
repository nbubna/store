/**
 * Copyright (c) 2026 Nathan Bubna
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Store nothing when storage is not supported.
 *
 * Status: USEFUL
 */
import store from "store2";
import type { StorageLike } from "../types";
import type { InternalSupport } from "../internal";

const _ = store._ as unknown as InternalSupport;

const _set = _.set;
_.set = function (area: StorageLike, key: string, value: string, overwrite?: unknown) {
  return area.name === "fake" ? undefined : _set(area, key, value, overwrite);
};
