import type { DeveloperTools } from "store2";

declare module "store2" {
  interface DeveloperTools {
    dom(): Element[];
  }
}

/** Side-effect import: declarative `[store]` DOM binding via `store._.dom()`. */
export {};
