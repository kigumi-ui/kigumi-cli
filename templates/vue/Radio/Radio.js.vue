<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './Radio.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/radio/radio.js'));
}

/**
 * Radios allow the user to select a single option from a group
 */
const props = defineProps({
    value: { type: String, required: false },
    disabled: { type: Boolean, required: false, default: false },
    size: { type: String, required: false, default: 'medium' },
    appearance: { type: String, required: false, default: 'default' }
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

const emit = defineEmits(['blur', 'focus']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleBlur = (e) => emit('blur', e);
const handleFocus = (e) => emit('focus', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('blur', handleBlur);
  el.addEventListener('focus', handleFocus);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('blur', handleBlur);
  el.removeEventListener('focus', handleFocus);
});

defineExpose({
  setCustomValidity: (message) => elementRef.value?.setCustomValidity?.(message),
  formStateRestoreCallback: (state, reason) => elementRef.value?.formStateRestoreCallback?.(state, reason),
  resetValidity: () => elementRef.value?.resetValidity?.(),
  element: elementRef,
});
</script>

<template>
  <wa-radio
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-radio>
</template>
