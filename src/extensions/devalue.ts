/**
 * Copyright (c) 2026 Nathan Bubna
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Uses devalue for stringify/parse so stored values can include Dates, Map, Set,
 * undefined, circular references, and other types JSON cannot represent.
 *
 *   import store from "store2";
 *   import "store2/devalue";
 *
 * Status: USEFUL
 */
import store from "store2";
import { parse as devalueParse, stringify as devalueStringify } from "devalue";
import type { DeveloperTools, Replacer, Reviver } from "../types";
import type { InternalSupport } from "../internal";

export type DevalueReducer = (value: unknown) => unknown;
export type DevalueReviver = (value: unknown) => unknown;

export type DevalueExtensions = {
  devalueReducers?: Record<string, DevalueReducer>;
  devalueRevivers?: Record<string, DevalueReviver>;
};

export type DevalueDeveloperTools = DeveloperTools & DevalueExtensions & InternalSupport;

const _ = store._ as DevalueDeveloperTools;

const jsonStringify = _.stringify;
const jsonParse = _.parse;

_.stringify = function (d: unknown, fn?: Replacer) {
  if (d === undefined || typeof d === "function") {
    return String(d);
  }
  if (fn || _.replace) {
    return jsonStringify(d, fn);
  }
  try {
    return devalueStringify(d, _.devalueReducers as Record<string, (value: unknown) => unknown>);
  } catch {
    return jsonStringify(d, fn);
  }
} as InternalSupport["stringify"];

_.parse = function (s: string, fn?: Reviver) {
  if (fn || _.revive) {
    return jsonParse(s, fn);
  }
  try {
    return devalueParse(s, _.devalueRevivers as Record<string, (value: unknown) => unknown>);
  } catch {
    return jsonParse(s, fn);
  }
} as InternalSupport["parse"];
