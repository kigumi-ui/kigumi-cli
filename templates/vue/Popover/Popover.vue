<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import './Popover.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/popover/popover.js'));
}

/**
 * Popovers display additional content when users interact with a trigger element
 */
export interface PopoverProps {
  disabled?: boolean;
  placement?: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'right' | 'right-start' | 'right-end' | 'left' | 'left-start' | 'left-end';
  trigger?: string;
  distance?: number;
  skidding?: number;
  'with-arrow'?: boolean;
  'without-arrow'?: boolean;
  for?: string;
}

const props = defineProps<PopoverProps>();

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
});

const emit = defineEmits<{
  'wa-show': [event: CustomEvent];
  'wa-after-show': [event: CustomEvent];
  'wa-hide': [event: CustomEvent];
  'wa-after-hide': [event: CustomEvent];
}>();

const open = defineModel<boolean>('open', { default: false });

const elementRef = ref<HTMLElement | null>(null);

watch(open, (newOpen) => {
  const el = elementRef.value as any;
  if (!el) return;
  const isOpen = el.open ?? false;
  if (newOpen && !isOpen) el.show?.();
  else if (!newOpen && isOpen) el.hide?.();
});

onMounted(() => {
  ensureLoaded();
});

const handleWaShow = (e: Event) => { open.value = true; emit('wa-show', e as CustomEvent); };
const handleWaAfterShow = (e: Event) => emit('wa-after-show', e as CustomEvent);
const handleWaHide = (e: Event) => { open.value = false; emit('wa-hide', e as CustomEvent); };
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
  show: () => (elementRef.value as any)?.show?.(),
  hide: () => (elementRef.value as any)?.hide?.(),
  element: elementRef,
});
</script>

<template>
  <wa-popover
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
    :open="open"
  >
    <slot />
  </wa-popover>
</template>
