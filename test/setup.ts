import store from "../src/store2.ts";

const extensions = [
  "bind",
  "cache",
  "old",
  "overflow",
  "quota",
  "measure",
  "array",
  "dot",
  "deep",
  "dom",
  "on",
  "async",
];

for (const name of extensions) {
  await import(`../src/extensions/${name}.ts`);
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  store.clearAll();
  delete store._.revive;
  delete store._.replace;
});

export { store };
