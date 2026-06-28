# Migrating to ESM-only store2

Current releases ship **ESM only** (`.mjs`). There is no CommonJS build (`*.cjs`).

## Node.js version

**Minimum: Node.js 20.19.0** (active LTS or newer).

Node 18 reached end-of-life in April 2025. Node 20.19+ supports loading this package from CommonJS via [`require(esm)`](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require).

## Loading the package

| Use case | How |
|----------|-----|
| ESM (preferred) | `import store from 'store2'` |
| ESM extensions | `import 'store2/cache'` |
| Node CommonJS (legacy scripts) | `const store = require('store2').default` |
| Browser script tag | `store2.js` / `store2.min.js` (`window.store`) |

## Upgrading from releases with `*.cjs`

- Remove any dependency on `require('store2')` returning the store directly — use `import` or `.default` from `require(esm)`.
- Replace `require('store2/...')` with `import 'store2/...'`.
- Delete references to `dist/*.cjs` paths in bundler configs.

## Extensions

Subpaths are unchanged by name; only the format is ESM:

```javascript
import store from 'store2';
import 'store2/on';
import 'store2/cache';
```

## Node without a browser

store2 wraps `localStorage` / `sessionStorage`. In Node (tests, SSR, scripts), provide a polyfill (e.g. jsdom, `node-localstorage`) the same as before.

## Summary checklist

- [ ] Node **≥ 20.19.0**
- [ ] Use `import store from 'store2'` (or `require('store2').default` in CJS callers)
- [ ] Use `import 'store2/...'` for extensions
- [ ] Keep script-tag / IIFE usage as-is if applicable
