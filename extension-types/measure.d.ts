import type { StoreAPI } from "store2";

declare module "store2" {
  interface StoreAPI {
    remainingSpace(): number;
    charsUsed(): number;
    charsLeft(test?: boolean): number;
    charsTotal(test?: boolean): number;
  }
}

/** Side-effect import: storage space measurement helpers. */
export {};
