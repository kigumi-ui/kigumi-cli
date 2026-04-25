<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import './Dropdown.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/dropdown/dropdown.js'));
}

/**
 * Dropdowns expose additional content that pops up when the user interacts with a trigger
 */
const props = defineProps({
    placement: { type: String, required: false, default: 'bottom-start' },
    disabled: { type: Boolean, required: false, default: false },
    'stay-open-on-select': { type: Boolean, required: false, default: false },
    distance: { type: Number, required: false, default: 0 },
    skidding: { type: Number, required: false, default: 0 },
    hoist: { type: Boolean, required: false, default: false },
    size: { type: String, required: false, default: 'medium' }
});

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
});

const emit = defineEmits(['wa-show', 'wa-after-show', 'wa-hide', 'wa-after-hide', 'wa-select']);

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
const handleWaSelect = (e) => emit('wa-select', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-show', handleWaShow);
  el.addEventListener('wa-after-show', handleWaAfterShow);
  el.addEventListener('wa-hide', handleWaHide);
  el.addEventListener('wa-after-hide', handleWaAfterHide);
  el.addEventListener('wa-select', handleWaSelect);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-show', handleWaShow);
  el.removeEventListener('wa-after-show', handleWaAfterShow);
  el.removeEventListener('wa-hide', handleWaHide);
  el.removeEventListener('wa-after-hide', handleWaAfterHide);
  el.removeEventListener('wa-select', handleWaSelect);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-dropdown
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
    :open="open"
  >
    <slot />
  </wa-dropdown>
</template>
