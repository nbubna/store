/**
 * Copyright (c) 2026 Nathan Bubna
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Declarative, persistent DOM content.
 *
 *   <input store name="whatever">
 *   <div store="somekey" store-area="session" contenteditable>Some content</div>
 *
 * Status: USEFUL - uses store, doesn't extend it, deserves standalone project
 */
import store from "store2";
import type { DeveloperTools, Store, StoreBase } from "../types";

export type DOMHelper = {
  (): Element[];
  selector: string;
  event: string;
  node(node: Element, i?: number): void;
  area(node: Element): StoreBase;
  key(node: Element, i?: number): string;
  get(node: HTMLElement): string;
  set(node: HTMLElement, value: unknown): void;
};

export type DomDeveloperTools = DeveloperTools & { dom: DOMHelper };

const _ = store._ as DomDeveloperTools;

function domInit() {
  const nodes = document.querySelectorAll(DOM.selector),
    array = Array.prototype.slice.call(nodes) as Element[];
  for (let i = 0; i < array.length; i++) {
    DOM.node(array[i], i);
  }
  return array;
}

const DOM: DOMHelper = Object.assign(domInit, {
  selector: "[store],[store-area]",
  event: "input",
  node: function (node: Element, i?: number) {
    const key = DOM.key(node, i),
      area = DOM.area(node);
    let value = area(key);
    if (value === null || value === undefined) {
      value = DOM.get(node as HTMLElement);
    } else {
      DOM.set(node as HTMLElement, value);
    }
    const el = node as HTMLElement & { storeListener?: boolean };
    if (!el.storeListener) {
      el.addEventListener(DOM.event, function () {
        area(key, DOM.get(el));
      });
      el.storeListener = true;
    }
  },
  area: function (node: Element) {
    const areaName = node.getAttribute("store-area") || "local";
    return (store as Store & Record<string, StoreBase>)[areaName];
  },
  key: function (node: Element, i?: number) {
    return (
      node.getAttribute("store") ||
      node.getAttribute("name") ||
      "dom." + node.nodeName.toLowerCase() + (i || "")
    );
  },
  get: function (node: HTMLElement) {
    return (node as HTMLInputElement).value || node.innerHTML;
  },
  set: function (node: HTMLElement, value: unknown) {
    if ("value" in node) {
      (node as HTMLInputElement).value = value as string;
    } else {
      node.innerHTML = typeof value === "string" ? value : _.stringify(value);
    }
  },
});

_.dom = DOM;

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", DOM);
}
