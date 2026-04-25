<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import './Tooltip.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/tooltip/tooltip.js'));
}

/**
 * Tooltips display additional information based on a specific action
 */
const props = defineProps({
    placement: { type: String, required: false, default: 'top' },
    disabled: { type: Boolean, required: false, default: false },
    distance: { type: Number, required: false, default: 8 },
    skidding: { type: Number, required: false, default: 0 },
    trigger: { type: String, required: false, default: 'hover focus' },
    'without-arrow': { type: Boolean, required: false, default: false },
    'show-delay': { type: Number, required: false, default: 150 },
    'hide-delay': { type: Number, required: false, default: 0 },
    for: { type: String, required: false }
});

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
});

const emit = defineEmits(['wa-show', 'wa-after-show', 'wa-hide', 'wa-after-hide']);

const open = defineModel('open', { default: false });

const elementRef = ref(null);

watch(open, (newOpen) => {
  const el = elementRef.value;
  if (!el) return;
  const isOpen = el.open ?? false;
  if (newOpen && !isOpen) el.show?.();
  else if (!newOpen && isOpen) el.hide?.();
});

onMounted(() => {
  ensureLoaded();
});

const handleWaShow = (e) => { open.value = true; emit('wa-show', e); };
const handleWaAfterShow = (e) => emit('wa-after-show', e);
const handleWaHide = (e) => { open.value = false; emit('wa-hide', e); };
const handleWaAfterHide = (e) => emit('wa-after-hide', e);

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
  show: () => elementRef.value?.show?.(),
  hide: () => elementRef.value?.hide?.(),
  element: elementRef,
});
</script>

<template>
  <wa-tooltip
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
    :open="open"
  >
    <slot />
  </wa-tooltip>
</template>
