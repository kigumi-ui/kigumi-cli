<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './ResizeObserver.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/resize-observer/resize-observer.js'));
}

/**
 * Reports changes to the dimensions of an element
 */
export interface ResizeObserverProps {
  disabled?: boolean;
}

const props = defineProps<ResizeObserverProps>();

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
  'wa-resize': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaResize = (e: Event) => emit('wa-resize', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-resize', handleWaResize);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-resize', handleWaResize);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-resize-observer
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-resize-observer>
</template>
