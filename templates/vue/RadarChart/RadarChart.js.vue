<script setup>
import { ref, computed, onMounted } from 'vue';
import './RadarChart.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/radar-chart/radar-chart.js'));
}

/**
 * Maps multiple variables onto radial axes to compare profiles at a glance
 */
const props = defineProps({
    label: { type: String, required: false },
    description: { type: String, required: false },
    'legend-position': { type: String, required: false, default: 'top' },
    stacked: { type: Boolean, required: false, default: false },
    grid: { type: String, required: false, default: 'both' },
    min: { type: Number, required: false },
    max: { type: Number, required: false },
    'without-animation': { type: Boolean, required: false, default: false },
    'without-legend': { type: Boolean, required: false, default: false },
    'without-tooltip': { type: Boolean, required: false, default: false }
});

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
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
  <wa-radar-chart
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-radar-chart>
</template>
