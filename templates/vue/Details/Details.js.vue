<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import './Details.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/details/details.js'));
}

/**
 * Shows a brief summary and expands to show additional content
 */
const props = defineProps({
  summary: { type: String, required: false },
  disabled: { type: Boolean, required: false, default: false },
  appearance: { type: String, required: false, default: 'outlined' },
  'icon-placement': { type: String, required: false, default: 'end' },
  name: { type: String, required: false },
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
  <wa-details
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
    :open="open"
  >
    <slot />
  </wa-details>
</template>
