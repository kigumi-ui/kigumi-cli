<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import './RadarChart.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/radar-chart/radar-chart.js'));
}

/**
 * Maps multiple variables onto radial axes to compare profiles at a glance
 */
export interface RadarChartProps {
  label?: string;
  description?: string;
  'legend-position'?: 'top' | 'right' | 'bottom' | 'left' | 'start' | 'end';
  stacked?: boolean;
  grid?: 'x' | 'y' | 'both' | 'none';
  min?: number;
  max?: number;
  'without-animation'?: boolean;
  'without-legend'?: boolean;
  'without-tooltip'?: boolean;
}

const props = defineProps<RadarChartProps>();

// Strip undefined and false props before forwarding to the web component.
// Vue boolean-prop coercion materializes absent optional Boolean props as
// `false`, but Web Awesome elements read attribute presence as truthy, so
// we must not forward `false` to <wa-*> (would render pill="" / loading="").
const definedProps = computed(() => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
    if (value !== undefined && value !== false) result[key] = value;
  }
  return result;
});

const emit = defineEmits<{
  // No events for this component
}>();

const elementRef = ref<HTMLElement | null>(null);

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
