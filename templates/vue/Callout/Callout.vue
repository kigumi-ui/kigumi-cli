<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import './Callout.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/callout/callout.js'));
}

/**
 * Callouts are used to display important messages inline
 */
export interface CalloutProps {
  appearance?: 'accent' | 'filled' | 'outlined' | 'plain' | 'filled-outlined';
  size?: 'small' | 'medium' | 'large';
  variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
}

const props = defineProps<CalloutProps>();

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
  <wa-callout
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-callout>
</template>
