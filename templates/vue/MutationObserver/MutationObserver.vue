<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './MutationObserver.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/mutation-observer/mutation-observer.js'));
}

/**
 * Observes changes to a target element and emits events when they occur
 */
export interface MutationObserverProps {
  attr?: string;
  'attr-old-value'?: boolean;
  'char-data'?: boolean;
  'char-data-old-value'?: boolean;
  'child-list'?: boolean;
  disabled?: boolean;
  subtree?: boolean;
}

const props = defineProps<MutationObserverProps>();

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
  'wa-mutation': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaMutation = (e: Event) => emit('wa-mutation', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-mutation', handleWaMutation);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-mutation', handleWaMutation);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-mutation-observer
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-mutation-observer>
</template>
