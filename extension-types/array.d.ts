import type { StoreAPI } from "store2";

declare module "store2" {
  interface StoreAPI {
    array(fnName: string, key: string, args?: unknown[] | null): unknown;
    push(key: string, ...items: unknown[]): number;
    pop(key: string): unknown;
    indexOf(key: string, ...args: unknown[]): number;
  }
}

/** Side-effect import: adds Array helper methods to store. */
export {};
