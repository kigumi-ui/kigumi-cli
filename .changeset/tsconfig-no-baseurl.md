---
'kigumi': patch
---

### Fixed

`kigumi init` no longer writes `baseUrl` into your `tsconfig.json`.

TypeScript deprecated `baseUrl` in 6.0 and removed it in 7.0, and
`typescript@latest` is now 7.x. Writing it meant a fresh project's very first
`tsc` run failed on a config Kigumi had generated:

```
error TS5102: Option 'baseUrl' has been removed. Please remove it from your
configuration.
```

The `@/*` path alias resolves relative to the tsconfig without it, so nothing
else changes. A `baseUrl` already present in your own tsconfig is left untouched.
