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
  <wa-sparkline
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-sparkline>
</template>
