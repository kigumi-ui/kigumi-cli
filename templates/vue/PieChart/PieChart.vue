<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import './PieChart.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/pie-chart/pie-chart.js'));
}

/**
 * Divides a circle into wedges that represent each category's share of the whole
 */
export interface PieChartProps {
  label?: string;
  description?: string;
  'legend-position'?: 'top' | 'right' | 'bottom' | 'left' | 'start' | 'end';
  'without-animation'?: boolean;
  'without-legend'?: boolean;
  'without-tooltip'?: boolean;
}

const props = defineProps<PieChartProps>();

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
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
  <wa-pie-chart
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-pie-chart>
</template>
