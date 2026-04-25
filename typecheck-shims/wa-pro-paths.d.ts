/**
 * Ambient declarations for Pro-only Web Awesome import paths.
 *
 * Why this file exists: templates for Pro-tier components import from
 * `@awesome.me/webawesome/dist/components/<x>/<x>.js`. The Free package
 * — the only one we install for typecheck per the spec — does not ship
 * those paths. At materialize time the import is rewritten to
 * `@awesome.me/webawesome-pro/...`.
 *
 * MUST be a SCRIPT file (no top-level import/export). In a module file,
 * `declare module 'X' { ... }` becomes a module *augmentation* that
 * requires 'X' to already be known — which defeats the purpose.
 * JSX intrinsic augmentation lives in `wa-pro-jsx.d.ts` (a module file).
 */

declare module '@awesome.me/webawesome/dist/components/bar-chart/bar-chart.js' {
  export default class _Default extends HTMLElement {}
}
declare module '@awesome.me/webawesome/dist/components/bubble-chart/bubble-chart.js' {
  export default class _Default extends HTMLElement {}
}
declare module '@awesome.me/webawesome/dist/components/chart/chart.js' {
  export default class _Default extends HTMLElement {}
}
declare module '@awesome.me/webawesome/dist/components/combobox/combobox.js' {
  export default class _Default extends HTMLElement {}
}
declare module '@awesome.me/webawesome/dist/components/doughnut-chart/doughnut-chart.js' {
  export default class _Default extends HTMLElement {}
}
declare module '@awesome.me/webawesome/dist/components/file-input/file-input.js' {
  export default class _Default extends HTMLElement {}
}
declare module '@awesome.me/webawesome/dist/components/line-chart/line-chart.js' {
  export default class _Default extends HTMLElement {}
}
declare module '@awesome.me/webawesome/dist/components/number-input/number-input.js' {
  export default class _Default extends HTMLElement {}
}
declare module '@awesome.me/webawesome/dist/components/pie-chart/pie-chart.js' {
  export default class _Default extends HTMLElement {}
}
declare module '@awesome.me/webawesome/dist/components/polar-area-chart/polar-area-chart.js' {
  export default class _Default extends HTMLElement {}
}
declare module '@awesome.me/webawesome/dist/components/radar-chart/radar-chart.js' {
  export default class _Default extends HTMLElement {}
}
declare module '@awesome.me/webawesome/dist/components/scatter-chart/scatter-chart.js' {
  export default class _Default extends HTMLElement {}
}
declare module '@awesome.me/webawesome/dist/components/sparkline/sparkline.js' {
  export default class _Default extends HTMLElement {}
}
declare module '@awesome.me/webawesome/dist/components/toast/toast.js' {
  export default class _Default extends HTMLElement {}
  // Pro-only options bag for `Toast.create(message, options)`. Real shape
  // lives in `@awesome.me/webawesome-pro`; we type it as `unknown` here so
  // typecheck without Pro installed passes without asserting field details.
  export type ToastCreateOptions = unknown;
}
declare module '@awesome.me/webawesome/dist/components/toast-item/toast-item.js' {
  export default class _Default extends HTMLElement {}
}
