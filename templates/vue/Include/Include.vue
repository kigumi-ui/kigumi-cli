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
