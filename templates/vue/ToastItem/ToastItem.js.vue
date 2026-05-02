<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './ToastItem.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/toast-item/toast-item.js'));
}

/**
 * A single notification banner that can be stacked inside a Toast container
 */
const props = defineProps({
  variant: { type: String, required: false, default: 'neutral' },
  size: { type: String, required: false, default: 'medium' },
  duration: { type: Number, required: false, default: 5000 },
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

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaShow = (e) => emit('wa-show', e);
const handleWaAfterShow = (e) => emit('wa-after-show', e);
const handleWaHide = (e) => emit('wa-hide', e);
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
  hide: () => elementRef.value?.hide?.(),
  element: elementRef,
});
</script>

<template>
  <wa-toast-item ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-toast-item>
</template>
