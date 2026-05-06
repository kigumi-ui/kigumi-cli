import { defineConfig } from 'tsup';

// Splitting is left at the tsup default (`true`) for ESM with multiple
// entries. With `splitting: false` tsup inlines `bin.ts`'s
// `await import('./index.js')` at build time, doubling the tarball size
// (~431 KB to ~670 KB). The default emits content-hashed `chunk-*.js` /
// `install-*.js` helpers alongside `index.js` and `bin.js`; all live in
// `dist/`, all ship together, and the tarball stays small. Hash churn
// between unrelated builds is the trade-off accepted here.
export default defineConfig({
  entry: { index: 'src/index.ts', bin: 'src/bin.ts' },
  format: ['esm'],
  sourcemap: true,
  clean: true,
  dts: { entry: { index: 'src/index.ts' } },
});
