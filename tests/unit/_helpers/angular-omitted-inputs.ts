/**
 * CEM attributes an Angular Template declares no `@Input()` for, pinned as
 * committed data (issue #77).
 *
 * Angular has no rest spread, so an attribute that is not a registry prop has
 * no way onto the `wa-*` host: the React and Vue Templates pass these through,
 * the Angular ones cannot. The Angular function harness probes every other
 * CEM attribute, and fails in both directions against this pin: an attribute
 * missing its `@Input()` that is not listed here, and a listed attribute that
 * now has an `@Input()` or is no longer in the CEM.
 *
 * Deliberately not derived from validate:cem-sync's allowlists. Sharing that
 * predicate let one edit there both silence the drift warning and shrink the
 * Angular proof, so nothing would object to an over-broad entry. Widening
 * what Angular may skip is an edit to this file, in the same commit.
 */

/**
 * Inherited from Web Awesome's base element, so present on (almost) every
 * CEM entry. Omittable wherever the CEM declares them, rather than listed per
 * component: the `format-*` and `relative-time` entries declare no `lang`.
 */
export const ANGULAR_INHERITED_OMISSIONS: ReadonlySet<string> = new Set([
  'dir',
  'lang',
  'did-ssr',
]);

/**
 * Per registry key, the kebab-cased CEM attributes the Template has no
 * `@Input()` for, beyond the inherited three. Mostly `with-*` SSR slot hints
 * and attributes validate:cem-sync tracks as backfill (#101, #102, #116).
 */
export const ANGULAR_OMITTED_INPUTS: Readonly<
  Record<string, readonly string[]>
> = {
  button: ['title', 'with-start', 'with-end', 'custom-error'],
  input: ['title', 'spellcheck', 'with-label', 'with-hint', 'custom-error'],
  card: ['with-header-actions', 'with-footer-actions'],
  dialog: ['with-footer'],
  carousel: ['slides', 'current-slide'],
  checkbox: ['title', 'custom-error'],
  'color-picker': ['with-label', 'with-hint', 'custom-error'],
  combobox: ['with-label', 'with-hint', 'custom-error'],
  'copy-button': ['tooltip'],
  drawer: ['with-footer'],
  'dropdown-item': ['submenu-open'],
  'intersection-observer': ['root'],
  popup: [
    'boundary',
    'flip-boundary',
    'shift-boundary',
    'auto-size-boundary',
    'hover-bridge',
  ],
  'qr-code': ['image', 'image-background', 'image-coverage', 'image-padding'],
  'radio-group': ['with-label', 'with-hint', 'custom-error'],
  radio: ['name', 'custom-error'],
  rating: ['role', 'default-value', 'get-symbol', 'custom-error'],
  select: ['with-label', 'with-hint', 'custom-error'],
  slider: [
    'min-value',
    'max-value',
    'indicator-offset',
    'tooltip-distance',
    'tooltip-placement',
    'with-label',
    'with-hint',
    'custom-error',
  ],
  switch: ['title', 'with-hint', 'custom-error'],
  tab: ['role'],
  'tab-panel': ['role'],
  'tag-input': [
    'with-label',
    'with-hint',
    'autocapitalize',
    'autocorrect',
    'autocomplete',
    'enterkeyhint',
    'spellcheck',
    'inputmode',
    'custom-error',
  ],
  textarea: [
    'title',
    'autocapitalize',
    'autocorrect',
    'autocomplete',
    'autofocus',
    'enterkeyhint',
    'inputmode',
    'with-label',
    'with-hint',
    'custom-error',
  ],
  tree: ['tabindex', 'role'],
  'tree-item': ['tabindex', 'role'],
  'zoomable-frame': ['with-theme-sync'],
  'file-input': ['capture', 'with-label', 'with-hint', 'name', 'custom-error'],
  'number-input': [
    'title',
    'pill',
    'readonly',
    'autocomplete',
    'autofocus',
    'enterkeyhint',
    'inputmode',
    'with-label',
    'with-hint',
    'name',
    'custom-error',
  ],
  'otp-input': ['autofocus', 'custom-error'],
  chart: ['plugins'],
  'bar-chart': ['type', 'plugins'],
  'line-chart': ['type', 'plugins'],
  'bubble-chart': ['type', 'plugins'],
  'doughnut-chart': [
    'type',
    'x-label',
    'y-label',
    'stacked',
    'index-axis',
    'grid',
    'min',
    'max',
    'plugins',
  ],
  'pie-chart': [
    'type',
    'x-label',
    'y-label',
    'stacked',
    'index-axis',
    'grid',
    'min',
    'max',
    'plugins',
  ],
  'polar-area-chart': [
    'type',
    'x-label',
    'y-label',
    'stacked',
    'index-axis',
    'grid',
    'min',
    'max',
    'plugins',
  ],
  'radar-chart': ['type', 'x-label', 'y-label', 'index-axis', 'plugins'],
  'scatter-chart': ['type', 'stacked', 'index-axis', 'plugins'],
  'toast-item': ['with-icon'],
  'time-input': [
    'autocomplete',
    'with-label',
    'with-hint',
    'distance',
    'custom-error',
  ],
  'known-date': ['autocomplete', 'with-label', 'with-hint', 'custom-error'],
  video: ['duration', 'current-time'],
  'date-input': ['with-label', 'with-hint', 'custom-error'],
};
