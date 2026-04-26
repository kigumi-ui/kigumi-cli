<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { ToastCreateOptions } from '@awesome.me/webawesome/dist/components/toast/toast.js';
import './Toast.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/toast/toast.js'));
}

/**
 * Container that manages and stacks lightweight notification banners at a chosen screen edge
 */
export interface ToastProps {
  placement?: 'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end';
}

const props = defineProps<ToastProps>();

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
  create: (message: string, options: ToastCreateOptions) => (elementRef.value as any)?.create?.(message, options),
  element: elementRef,
});
</script>

<template>
  <wa-toast
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-toast>
</template>
