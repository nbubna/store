/**
 * Integration smoke test: Node CommonJS require(esm) (Node >= 20.19).
 */
const store = require("store2").default;

store.set("cjs", 42);
if (store.get("cjs") !== 42) {
  throw new Error("require(esm) default export failed");
}

console.log("cjs-require integration OK");
