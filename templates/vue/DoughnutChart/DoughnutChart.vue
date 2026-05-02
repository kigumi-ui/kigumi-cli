<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import './DoughnutChart.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/doughnut-chart/doughnut-chart.js'));
}

/**
 * Shows proportional segments in a ring shape with an open center for summary content
 */
export interface DoughnutChartProps {
  label?: string;
  description?: string;
  'legend-position'?: 'top' | 'right' | 'bottom' | 'left' | 'start' | 'end';
  'without-animation'?: boolean;
  'without-legend'?: boolean;
  'without-tooltip'?: boolean;
}

const props = defineProps<DoughnutChartProps>();

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
  <wa-doughnut-chart
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-doughnut-chart>
</template>
