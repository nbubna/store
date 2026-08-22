# Migrating from store2 2.x to 3.0.0

store2 **3.0.0** is a modernization release: TypeScript source, Vite build, first-class types, and **ESM-only** distribution. The public API is intentionally familiar, but packaging, tooling, and a few extension behaviors changed.

## Quick checklist

- [ ] **Node.js ≥ 20.19.0** (required for `require(esm)` if you still use CommonJS)
- [ ] Replace `require('store2')` with `import store from 'store2'` (or `require('store2').default`)
- [ ] Replace `require('store2/...')` with `import 'store2/...'`
- [ ] Remove references to `dist/*.cjs` — there is no CommonJS build
- [ ] Update bundler config if it assumed UMD/CJS `main` (now `./dist/store2.mjs`)
- [ ] Load extensions via subpath imports: `import 'store2/cache'`
- [ ] Opt in to new extensions explicitly: `store2/devalue`, `store2/proxy`
- [ ] Review deprecated extensions: `bind` (use `on`), `dot` (use `proxy`), `old` (legacy IE; deprecated, will be removed)

---

## Node.js version

**Minimum: Node.js 20.19.0.**

Node 18 reached end-of-life in April 2025. Node 20.19+ supports loading this package from CommonJS via [`require(esm)`](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require):

```javascript
const store = require("store2").default;
```

ESM (preferred):

```javascript
import store from "store2";
```

---

## Package format (breaking)

| 2.x | 3.0.0 |
|-----|-------|
| Mixed JS sources (`src/*.js`) | TypeScript (`src/**/*.ts`) |
| CJS + ESM + IIFE builds | **ESM** (`.mjs`) + IIFE (`store2.js`, `store2.min.js`) |
| `main` often pointed at CJS | `main` / `module` → `./dist/store2.mjs` |
| Root `index.d.ts` | `./dist/index.d.ts` (rolled up from source) |
| Extensions as `src/store.*.js` | Extensions as `dist/extensions/*.mjs` + typed subpaths |

### Removed artifacts

- `dist/*.cjs` CommonJS bundles
- Bower / Component manifests (removed in 2.14.3; unchanged in 3.x)
- Vendored test libs under `libs/` (tests use Vitest + jsdom)

---

## Import map

| Use case | 3.0.0 |
|----------|-------|
| ESM application / bundler | `import store from 'store2'` |
| TypeScript | types ship at `store2` and `store2/<extension>` |
| Extension side-effect import | `import 'store2/cache'` |
| Extension with types | `import type { ... } from 'store2'` + `import 'store2/on'` |
| **New:** `devalue` serialization | `import 'store2/devalue'` |
| **New:** property proxy API | `import store from 'store2/proxy'` |
| Node CommonJS (legacy) | `require('store2').default` |
| Browser `<script>` tag | `store2.min.js` → `window.store` |
| CDN (jsDelivr / unpkg) | `dist/store2.min.js` (unchanged URLs) |

### `exports` field

All public entry points are declared in `package.json` `exports`. Deep imports outside documented subpaths are not supported.

Available extension subpaths:

`array`, `async`, `bind`, `cache`, `cookie`, `cookies`, `deep`, `devalue`, `dom`, `dot`, `measure`, `old`, `on`, `onlyreal`, `overflow`, `proxy`, `quota`

---

## API compatibility

### Unchanged (core)

These behaviors are covered by the ported test suite (`test/store.test.ts`, 34 tests):

- `store(key, data)` / `store(key)` shortcuts
- `set`, `get`, `remove`, `has`, `transact`, `each`, `add`
- `getAll`, `setAll`, `keys`, `size`, `clear`, `clearAll`
- `namespace`, `area`, `local` / `session` / `page` areas
- Per-call and global `revive` / `replace` (JSON-based)
- `isFake(force)`, falsy alt values, namespace delimiter customization

### Extension changes

| Extension | Notes |
|-----------|-------|
| `deep` | No longer uses `eval`; uses `Function` constructor for path segments (security improvement from 2.14.4, retained) |
| `devalue` | **New.** Replaces `_.stringify` / `_.parse` with [devalue](https://github.com/sveltejs/devalue) when no custom replacer/reviver is active. Opt-in only. |
| `proxy` | **New.** Default export is a proxied store; do not load alongside tests expecting raw `store` shape. |
| `bind` | Deprecated; prefer `on` |
| `dot` | Deprecated; prefer `proxy` |
| `old` | **Deprecated.** Legacy IE userData backend; unsupported in 3.x and will be removed in a future major release |
| `measure` | Still experimental; `charsLeft()` can stress storage (unchanged risk) |

### TypeScript

3.0.0 ships accurate types for the core API and each extension subpath. Extension types use module augmentation (`declare module "store2"`).

`store2/proxy` exports `ProxyStore` (`Store & Record<string, unknown>`) for dynamic property access without polluting the base `Store` type alias.

---

## Build & development (for contributors / forks)

| 2.x | 3.0.0 |
|-----|-------|
| Manual builds / Grunt-era tooling | Vite (`npm run build`) |
| QUnit + vendored libs | Vitest + jsdom (`npm test`) |
| No typecheck in CI | `npm run typecheck` |
| — | `oxlint --type-aware` + `oxfmt` in CI |
| — | `publint` + `attw` (ESM-only profile) |

---

## Browser without bundler

Unchanged for the main bundle:

```html
<script src="https://cdn.jsdelivr.net/npm/store2/dist/store2.min.js"></script>
<script>
  store.set("key", "value");
</script>
```

Extensions are ESM modules in 3.x. For script-tag usage without a bundler, prefer the core API or load extensions through a bundler / `importmap`. The IIFE build exposes `window.store` only for the core library.

---

## Testing your upgrade

1. Run your app’s test suite against `store2@3.0.0`.
2. Verify extension imports use subpaths (`import 'store2/cache'` not relative `dist/` paths).
3. If you used CommonJS `require('store2')`, switch to `.default` or ESM import.
4. Optional: run the repo integration smokes — `npm run integration` (npm ESM + TypeScript, CJS require).

---

## Need 2.x?

Stay on the latest 2.x release (`2.14.4`) if you require CommonJS `require('store2')` without `.default`, or cannot move to Node 20.19+.

For new projects, 3.0.0 is the recommended line.
