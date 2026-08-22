import type { Store } from "store2";

export type QuotaHandler = (
  error: DOMException,
  area: Storage,
  key: string,
  value: string,
) => boolean | void;

declare module "store2" {
  interface Store {
    quota: ((fn: QuotaHandler) => void) & { fns: QuotaHandler[] };
  }
}

/** Side-effect import: quota error handlers via `store.quota(fn)`. */
export {};
