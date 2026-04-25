/**
 * JSX intrinsic-element declarations for Pro-only Web Awesome components.
 *
 * Augments JSX with Pro-only `wa-*` tags. The Free package's
 * `custom-elements-jsx.d.ts` declares Free tags via several
 * `declare module '<framework>' { namespace JSX { ... } }` blocks plus
 * a `declare global { namespace JSX { ... } }`. We mirror the same
 * shape so React 19 (looks at `React.JSX`), Vue, and global-JSX
 * fallbacks all see Pro tags.
 *
 * Used together with `wa-pro-paths.d.ts` (ambient module paths) so that
 * Pro-tier templates type-check without installing `webawesome-pro`.
 *
 * Note: the `declare module 'react'` block below is module augmentation
 * (interface merging), not a replacement. CLAUDE.md rule #3's intent —
 * "don't overwrite React exports" — does not apply here; augmentation is
 * the only mechanism for React 19's `React.JSX.IntrinsicElements`
 * namespace lookup.
 */

interface WaProIntrinsicElements {
  'wa-bar-chart': unknown;
  'wa-bubble-chart': unknown;
  'wa-chart': unknown;
  'wa-combobox': unknown;
  'wa-doughnut-chart': unknown;
  'wa-file-input': unknown;
  'wa-line-chart': unknown;
  'wa-number-input': unknown;
  'wa-pie-chart': unknown;
  'wa-polar-area-chart': unknown;
  'wa-radar-chart': unknown;
  'wa-scatter-chart': unknown;
  'wa-sparkline': unknown;
  'wa-toast': unknown;
  'wa-toast-item': unknown;
}

declare module 'react' {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntrinsicElements extends WaProIntrinsicElements {}
  }
}

declare global {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntrinsicElements extends WaProIntrinsicElements {}
  }
}

export {};
