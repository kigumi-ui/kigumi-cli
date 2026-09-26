<script setup>
import { ref, onMounted, useAttrs } from 'vue';
import './BarChart.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/bar-chart/bar-chart.js'));
}

/**
 * Displays categorical data as horizontal or vertical rectangular bars scaled to their values
 */
const props = defineProps({
  label: { type: String, required: false },
  description: { type: String, required: false },
  orientation: { type: String, required: false, default: 'vertical' },
  'x-label': { type: String, required: false },
  'y-label': { type: String, required: false },
  'legend-position': { type: String, required: false, default: 'top' },
  stacked: { type: Boolean, required: false, default: false },
  'index-axis': { type: String, required: false, default: 'x' },
  grid: { type: String, required: false, default: 'both' },
  min: { type: Number, required: false },
  max: { type: Number, required: false },
  'without-animation': { type: Boolean, required: false, default: false },
  'without-legend': { type: Boolean, required: false, default: false },
  'without-tooltip': { type: Boolean, required: false, default: false },
});

defineOptions({ inheritAttrs: false });

// Forward props and fallthrough attributes to the web component yourself,
// rather than through Vue's default fallthrough:
// - Web Awesome reads attribute presence as truthy, so `false` must never
//   reach <wa-*>. Vue materializes every absent optional Boolean prop as
//   `false`, and would render a fallthrough `false` as the string "false".
//   `aria-*` / `data-*` keep `false`, where "false" is a real value.
// - Vue camelizes declared prop keys (`with-caret` -> `withCaret`). Before
//   the element upgrades, that key lands as the attribute `withcaret`, which
//   Web Awesome never reads, so props go back to their kebab-case names.
// A plain function, not `computed`: `attrs` is tracked per property read,
// so a computed over an empty `attrs` would never see a later attribute.
const attrs = useAttrs();

function hostAttributes() {
  const result = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') continue;
    if (value === false && !/^(aria|data)-/.test(key)) continue;
    result[key] = value;
  }
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === false) continue;
    result[key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)] = value;
  }
  return result;
}

const emit = defineEmits([]);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-bar-chart
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
  >
    <slot />
  </wa-bar-chart>
</template>
