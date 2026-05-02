<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import './Dropdown.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/dropdown/dropdown.js'));
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
  size: { type: String, required: false, default: 'medium' },
});

// Strip undefined and false props before forwarding to the web component.
// Vue boolean-prop coercion materializes absent optional Boolean props as
// `false`, but Web Awesome elements read attribute presence as truthy, so
// we must not forward `false` to <wa-*> (would render pill="" / loading="").
const definedProps = computed(() => {
  const result = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined && value !== false) result[key] = value;
  }
  return result;
});

const emit = defineEmits([
  'wa-show',
  'wa-after-show',
  'wa-hide',
  'wa-after-hide',
  'wa-select',
]);

const open = defineModel('open', { default: false });

const elementRef = ref(null);

watch(open, (newOpen) => {
  const el = elementRef.value;
  if (el && el.open !== newOpen) el.open = newOpen;
});

onMounted(() => {
  ensureLoaded();
});

const handleWaShow = (e) => {
  open.value = true;
  emit('wa-show', e);
};
const handleWaAfterShow = (e) => emit('wa-after-show', e);
const handleWaHide = (e) => {
  open.value = false;
  emit('wa-hide', e);
};
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
