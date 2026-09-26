/**
 * Registry components whose CEM genuinely exposes no public methods, pinned
 * as committed data rather than derived from `COMPONENT_METADATA`: a derived
 * list would move with an emptied `methods` array and re-open the hole it
 * exists to close (ADR 0003). A WA bump that adds or removes a public method
 * edits this list in the same commit as the regenerated metadata.
 *
 * Shared by the React and Vue registry harnesses: whether a component has
 * public methods is a CEM fact, not a framework one.
 */
export const METHODLESS_COMPONENTS: readonly string[] = [
  'animated-image',
  'avatar',
  'badge',
  'bar-chart',
  'breadcrumb',
  'breadcrumb-item',
  'bubble-chart',
  'button-group',
  'callout',
  'card',
  'carousel-item',
  'chart',
  'checkbox-group',
  'comparison',
  'copy-button',
  'dialog',
  'divider',
  'doughnut-chart',
  'drawer',
  'dropdown',
  'format-bytes',
  'format-date',
  'format-number',
  'icon',
  'include',
  'intersection-observer',
  'line-chart',
  'mutation-observer',
  'option',
  'pagination',
  'pie-chart',
  'polar-area-chart',
  'progress-bar',
  'progress-ring',
  'qr-code',
  'radar-chart',
  'relative-time',
  'resize-observer',
  'scatter-chart',
  'scroller',
  'skeleton',
  'sparkline',
  'spinner',
  'split-panel',
  'tab',
  'tab-group',
  'tab-panel',
  'tag',
  'tree',
];
