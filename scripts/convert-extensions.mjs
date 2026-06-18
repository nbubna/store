import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(root, "../src");
const extDir = path.join(srcDir, "extensions");

function unwrapIife(code) {
  const start = code.search(/;\(function\s*\(/);
  if (start === -1) {
    return code.trim();
  }
  const open = code.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < code.length; i++) {
    if (code[i] === "{") depth++;
    if (code[i] === "}") depth--;
    if (depth === 0) {
      const body = code.slice(open + 1, i).trim();
      return body;
    }
  }
  return code.trim();
}

const files = fs.readdirSync(srcDir).filter((f) => f.startsWith("store.") && f.endsWith(".js"));

for (const file of files) {
  const name = file.replace(/^store\./, "").replace(/\.js$/, "");
  const raw = fs.readFileSync(path.join(srcDir, file), "utf8");
  const header = raw.match(/^[\s\S]*?(?=;\(function)/)?.[0]?.trim() || "";
  const body = unwrapIife(raw);
  const out = `import store from '../store2.js';\n\nconst _ = store._;\n\n${header}\n\n${body}\n`;
  fs.writeFileSync(path.join(extDir, `${name}.ts`), out);
  console.log("converted", name);
}
