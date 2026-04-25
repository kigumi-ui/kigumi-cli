<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import './Sparkline.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/sparkline/sparkline.js'));
}

/**
 * Sparklines are small inline data visualizations for showing trends
 */
export interface SparklineProps {
  data?: string;
  label?: string;
  appearance?: 'gradient' | 'line' | 'solid';
  trend?: 'positive' | 'negative' | 'neutral';
  curve?: 'linear' | 'natural' | 'step';
}

const props = defineProps<SparklineProps>();

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
  <wa-sparkline
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-sparkline>
</template>
