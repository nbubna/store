import store from "store2";
import { beforeEach } from "vitest";

beforeEach(() => {
  store.clearAll();
  delete store._.revive;
  delete store._.replace;
});

export { store };
