<script setup>
import { ref, computed, onMounted } from 'vue';
import './Chart.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/chart/chart.js'));
}

/**
 * Renders interactive data visualisations including bars, lines, pies, and more via Chart.js
 */
const props = defineProps({
  label: { type: String, required: false },
  description: { type: String, required: false },
  type: { type: String, required: false, default: 'bar' },
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

// Strip undefined and false props before forwarding to the web component.
// Vue boolean-prop coercion materializes absent optional Boolean props as
// `false`, but Web Awesome elements read attribute presence as truthy, so
// we must not forward `false` to <wa-*> (would render pill="" / loading="").
const definedProps = computed(() => {
  const result = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined && value !== false) result[key] = value;
  }
  return result;
});

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
  <wa-chart ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-chart>
</template>
