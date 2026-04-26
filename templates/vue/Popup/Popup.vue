<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './Popup.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/popup/popup.js'));
}

/**
 * Popup is a utility component for positioning elements relative to an anchor
 */
export interface PopupProps {
  active?: boolean;
  anchor?: string;
  placement?: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'right' | 'right-start' | 'right-end' | 'left' | 'left-start' | 'left-end';
  strategy?: 'absolute' | 'fixed';
  distance?: number;
  skidding?: number;
  arrow?: boolean;
  'arrow-placement'?: 'start' | 'end' | 'center' | 'anchor';
  'arrow-padding'?: number;
  flip?: boolean;
  'flip-fallback-placements'?: string;
  'flip-fallback-strategy'?: 'best-fit' | 'initial';
  'flip-padding'?: number;
  shift?: boolean;
  'shift-padding'?: number;
  'auto-size'?: 'horizontal' | 'vertical' | 'both';
  sync?: 'width' | 'height' | 'both';
  'auto-size-padding'?: number;
}

const props = defineProps<PopupProps>();

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
  'wa-reposition': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaReposition = (e: Event) => emit('wa-reposition', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-reposition', handleWaReposition);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-reposition', handleWaReposition);
});

defineExpose({
  reposition: () => (elementRef.value as any)?.reposition?.(),
  element: elementRef,
});
</script>

<template>
  <wa-popup
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-popup>
</template>
