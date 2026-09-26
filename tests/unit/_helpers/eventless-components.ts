/**
 * Registry components whose CEM genuinely declares no events, pinned as
 * committed data rather than derived from `COMPONENT_METADATA`: a derived
 * list would move with an emptied `events` array and let the dispatch and
 * cleanup checks run over nothing (ADR 0003). A WA bump that adds or removes
 * an event edits this list in the same commit as the regenerated metadata.
 *
 * Shared by the React and Vue registry harnesses: whether a component has
 * events is a CEM fact, not a framework one.
 */
export const EVENTLESS_COMPONENTS: readonly string[] = [
  'accordion-item',
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
  'divider',
  'doughnut-chart',
  'format-bytes',
  'format-date',
  'format-number',
  'line-chart',
  'markdown',
  'option',
  'page',
  'pie-chart',
  'polar-area-chart',
  'progress-bar',
  'progress-ring',
  'qr-code',
  'radar-chart',
  'relative-time',
  'scatter-chart',
  'scroller',
  'skeleton',
  'sparkline',
  'spinner',
  'tab',
  'tab-panel',
  'toast',
];
