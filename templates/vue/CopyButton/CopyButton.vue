<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './CopyButton.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/copy-button/copy-button.js'));
}

/**
 * Copies text data to the clipboard when clicked
 */
export interface CopyButtonProps {
  value?: string;
  from?: string;
  disabled?: boolean;
  'copy-label'?: string;
  'success-label'?: string;
  'error-label'?: string;
  'feedback-duration'?: number;
  'tooltip-placement'?: 'top' | 'right' | 'bottom' | 'left';
}

const props = defineProps<CopyButtonProps>();

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
  'wa-copy': [event: CustomEvent];
  'wa-error': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaCopy = (e: Event) => emit('wa-copy', e as CustomEvent);
const handleWaError = (e: Event) => emit('wa-error', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-copy', handleWaCopy);
  el.addEventListener('wa-error', handleWaError);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-copy', handleWaCopy);
  el.removeEventListener('wa-error', handleWaError);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-copy-button ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-copy-button>
</template>
