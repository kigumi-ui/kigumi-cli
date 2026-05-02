<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import './LineChart.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/line-chart/line-chart.js'));
}

/**
 * Connects sequential data points to reveal trends and patterns over a continuous axis
 */
export interface LineChartProps {
  label?: string;
  description?: string;
  'x-label'?: string;
  'y-label'?: string;
  'legend-position'?: 'top' | 'right' | 'bottom' | 'left' | 'start' | 'end';
  stacked?: boolean;
  'index-axis'?: 'x' | 'y';
  grid?: 'x' | 'y' | 'both' | 'none';
  min?: number;
  max?: number;
  'without-animation'?: boolean;
  'without-legend'?: boolean;
  'without-tooltip'?: boolean;
}

const props = defineProps<LineChartProps>();

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
  <wa-line-chart ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-line-chart>
</template>
