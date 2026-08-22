#!/usr/bin/env node
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, cwd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

run("npm run build", root);

for (const dir of ["integration/npm-esm", "integration/cjs-require"]) {
  const cwd = join(root, dir);
  run("npm install", cwd);
}

run("npm run typecheck", join(root, "integration/npm-esm"));
run("npm run start", join(root, "integration/npm-esm"));
run("npm start", join(root, "integration/cjs-require"));

console.log("\nAll integration smoke tests passed.");
