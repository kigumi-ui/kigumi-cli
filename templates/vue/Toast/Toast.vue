<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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
