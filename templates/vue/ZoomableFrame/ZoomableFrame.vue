<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './ZoomableFrame.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/zoomable-frame/zoomable-frame.js'));
}

/**
 * Zoomable frames display iframe content with zoom controls
 */
export interface ZoomableFrameProps {
  src?: string;
  srcdoc?: string;
  zoom?: number;
  'zoom-levels'?: string;
  allowfullscreen?: boolean;
  loading?: 'eager' | 'lazy';
  'without-controls'?: boolean;
  'without-interaction'?: boolean;
  sandbox?: string;
  referrerpolicy?: string;
}

const props = defineProps<ZoomableFrameProps>();

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
});

const emit = defineEmits<{
  'load': [event: CustomEvent];
  'error': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleLoad = (e: Event) => emit('load', e as CustomEvent);
const handleError = (e: Event) => emit('error', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('load', handleLoad);
  el.addEventListener('error', handleError);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('load', handleLoad);
  el.removeEventListener('error', handleError);
});

defineExpose({
  zoomIn: () => (elementRef.value as any)?.zoomIn?.(),
  zoomOut: () => (elementRef.value as any)?.zoomOut?.(),
  element: elementRef,
});
</script>

<template>
  <wa-zoomable-frame
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-zoomable-frame>
</template>
