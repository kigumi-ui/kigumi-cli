<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './Include.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/include/include.js'));
}

/**
 * Includes give you the power to embed external HTML files into the page
 */
export interface IncludeProps {
  src?: string;
  mode?: 'cors' | 'no-cors' | 'same-origin';
  'allow-scripts'?: boolean;
}

const props = defineProps<IncludeProps>();

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
});

const emit = defineEmits<{
  'wa-load': [event: CustomEvent];
  'wa-include-error': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaLoad = (e: Event) => emit('wa-load', e as CustomEvent);
const handleWaIncludeError = (e: Event) => emit('wa-include-error', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-load', handleWaLoad);
  el.addEventListener('wa-include-error', handleWaIncludeError);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-load', handleWaLoad);
  el.removeEventListener('wa-include-error', handleWaIncludeError);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-include
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-include>
</template>
