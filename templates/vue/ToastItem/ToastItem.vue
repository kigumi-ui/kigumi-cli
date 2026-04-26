<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './ToastItem.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/toast-item/toast-item.js'));
}

/**
 * A single notification banner that can be stacked inside a Toast container
 */
export interface ToastItemProps {
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'small' | 'medium' | 'large';
  duration?: number;
}

const props = defineProps<ToastItemProps>();

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
  'wa-show': [event: CustomEvent];
  'wa-after-show': [event: CustomEvent];
  'wa-hide': [event: CustomEvent];
  'wa-after-hide': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaShow = (e: Event) => emit('wa-show', e as CustomEvent);
const handleWaAfterShow = (e: Event) => emit('wa-after-show', e as CustomEvent);
const handleWaHide = (e: Event) => emit('wa-hide', e as CustomEvent);
const handleWaAfterHide = (e: Event) => emit('wa-after-hide', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-show', handleWaShow);
  el.addEventListener('wa-after-show', handleWaAfterShow);
  el.addEventListener('wa-hide', handleWaHide);
  el.addEventListener('wa-after-hide', handleWaAfterHide);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-show', handleWaShow);
  el.removeEventListener('wa-after-show', handleWaAfterShow);
  el.removeEventListener('wa-hide', handleWaHide);
  el.removeEventListener('wa-after-hide', handleWaAfterHide);
});

defineExpose({
  hide: () => (elementRef.value as any)?.hide?.(),
  element: elementRef,
});
</script>

<template>
  <wa-toast-item
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-toast-item>
</template>
