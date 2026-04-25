# Template typecheck shims

Ambient declarations consumed only by `templates/<framework>/tsconfig.json`.
**Not** shipped in the npm tarball (`package.json#files` whitelists `dist`,
`templates`, `llms.txt`, `README.md` only — this directory is excluded).

- `css.d.ts` — declares side-effect imports of `*.css` so React `.tsx` and Vue
  `<script setup>` blocks importing `./X.css` typecheck cleanly.
- `react-jsx.d.ts` — augments React's `JSX.IntrinsicElements` with the
  Web Awesome `wa-*` custom-element types from
  `@awesome.me/webawesome/dist/custom-elements-jsx.d.ts`. Mirrors the
  `wa.d.ts` shipped to user projects, but reads from the Free package
  instead of `webawesome-pro` (templates target both tiers).

When the user materializes a component, no shim is needed — Kigumi writes
its own JSX-augmentation file into the consuming project.
