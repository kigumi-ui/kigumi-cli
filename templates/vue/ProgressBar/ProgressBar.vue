<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import './ProgressBar.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js'));
}

/**
 * Progress bars are used to show the completion of a task or operation
 */
export interface ProgressBarProps {
  value?: number;
  indeterminate?: boolean;
  label?: string;
}

const props = defineProps<ProgressBarProps>();

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
  <wa-progress-bar
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-progress-bar>
</template>
