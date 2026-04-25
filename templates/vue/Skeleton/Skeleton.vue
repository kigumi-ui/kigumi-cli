<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import './Skeleton.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/skeleton/skeleton.js'));
}

/**
 * Skeletons are used to provide a visual representation of where content will eventually load
 */
export interface SkeletonProps {
  effect?: 'pulse' | 'sheen' | 'none';
}

const props = defineProps<SkeletonProps>();

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
  <wa-skeleton
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-skeleton>
</template>
