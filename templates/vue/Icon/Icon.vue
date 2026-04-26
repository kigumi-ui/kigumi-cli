<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './Icon.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/icon/icon.js'));
}

/**
 * Icons are symbols that can be used to represent various options within an application
 */
export interface IconProps {
  name?: string;
  library?: string;
  src?: string;
  label?: string;
  family?: string;
  variant?: string;
  'auto-width'?: boolean;
  'swap-opacity'?: boolean;
  rotate?: number;
  flip?: 'horizontal' | 'vertical' | 'both';
  animation?: string;
}

const props = defineProps<IconProps>();

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
  'wa-error': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaLoad = (e: Event) => emit('wa-load', e as CustomEvent);
const handleWaError = (e: Event) => emit('wa-error', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-load', handleWaLoad);
  el.addEventListener('wa-error', handleWaError);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-load', handleWaLoad);
  el.removeEventListener('wa-error', handleWaError);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-icon
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-icon>
</template>
