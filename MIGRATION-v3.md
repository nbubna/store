# Migrating from store2 2.x to 3.0.0

store2 **3.0.0** modernizes the codebase (TypeScript, Vite, first-class types) while keeping the core API familiar. The main breaking change is **ESM-only** distribution.

## Quick checklist

- [ ] **Node.js ≥ 20.19.0** (required for `require(esm)` if you still use CommonJS)
- [ ] Use ESM imports: `import store from 'store2'` — or `require('store2').default` from CJS
- [ ] Load extensions via subpaths: `import 'store2/cache'` (not `require('store2/...')` or `dist/` paths)
- [ ] Remove references to `dist/*.cjs` and bundler assumptions about UMD/CJS `main` (now `./dist/store2.mjs`)
- [ ] Opt in to new extensions: `store2/devalue`, `store2/proxy`
- [ ] Replace deprecated extensions: `bind` → `on`, `dot` → `proxy`; drop `old` (legacy IE, will be removed)

---

## What changed

| Area | 2.x | 3.0.0 |
|------|-----|-------|
| Source / build | JS (`src/*.js`), mixed CJS + ESM + IIFE | TypeScript, **ESM** (`.mjs`) + IIFE (`store2.js`, `store2.min.js`) |
| Entry | CJS `main` | `main` / `module` → `./dist/store2.mjs` |
| Types | Root `index.d.ts` | `./dist/index.d.ts` (rolled up) |
| Extensions | `src/store.*.js` | `dist/extensions/*.mjs` with typed subpath exports |
| Tooling (repo) | QUnit, vendored libs | Vitest, `oxlint`, `oxfmt`, `publint` |

**Removed:** `dist/*.cjs` bundles. Bower/Component manifests (gone since 2.14.3).

All public entry points are in `package.json` `exports`. Deep imports outside documented subpaths are unsupported.

Extension subpaths: `array`, `async`, `bind`, `cache`, `cookie`, `cookies`, `deep`, `devalue`, `dom`, `dot`, `measure`, `old`, `on`, `onlyreal`, `overflow`, `proxy`, `quota`

---

## Imports

| Use case | 3.0.0 |
|----------|-------|
| ESM / bundler | `import store from 'store2'` |
| TypeScript | types at `store2` and `store2/<extension>` |
| Extension (side effect) | `import 'store2/cache'` |
| Extension + types | `import type { ... } from 'store2'` + `import 'store2/on'` |
| Node CJS (legacy) | `require('store2').default` |
| Browser `<script>` | `store2.min.js` → `window.store` (core only; extensions need a bundler or importmap) |
| CDN | `dist/store2.min.js` on jsDelivr / unpkg (unchanged URLs) |

---

## API compatibility

**Core API unchanged** — shortcuts, `set`/`get`/`remove`/`has`/`transact`/`each`/`add`, `getAll`/`setAll`/`keys`/`size`/`clear`/`clearAll`, namespaces and areas, `revive`/`replace`, `isFake`, falsy alt values.

| Extension | Notes |
|-----------|-------|
| `deep` | No `eval`; uses `Function` for path segments (from 2.14.4) |
| `devalue` | **New.** [devalue](https://github.com/sveltejs/devalue) serialization when no custom replacer/reviver; opt-in |
| `proxy` | **New.** Default export is a proxied store |
| `bind` / `dot` | Deprecated → use `on` / `proxy` |
| `old` | Deprecated; legacy IE backend, will be removed |
| `measure` | Still experimental |

`store2/proxy` exports `ProxyStore` (`Store & Record<string, unknown>`) for typed dynamic property access.

---

## Verify your upgrade

1. Run your test suite against `store2@3.0.0`.
2. Confirm extension imports use `store2/<name>` subpaths.
3. Optional: `npm run integration` in this repo (npm ESM + TypeScript, CJS require).

---

## Need 2.x?

Stay on **2.14.4** if you need bare `require('store2')` without `.default`, or cannot use Node 20.19+. Otherwise, use 3.0.0 for new work.
