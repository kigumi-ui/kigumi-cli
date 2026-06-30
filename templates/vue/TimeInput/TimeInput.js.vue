<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './TimeInput.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/time-input/time-input.js'));
}

/**
 * Time inputs collect a time of day from the user
 */
const props = defineProps({
  name: { type: String, required: false, default: '' },
  value: { type: String, required: false },
  disabled: { type: Boolean, required: false, default: false },
  required: { type: Boolean, required: false, default: false },
  readonly: { type: Boolean, required: false, default: false },
  size: { type: String, required: false, default: 'medium' },
  appearance: { type: String, required: false, default: 'outlined' },
  pill: { type: Boolean, required: false, default: false },
  label: { type: String, required: false, default: '' },
  hint: { type: String, required: false, default: '' },
  'with-clear': { type: Boolean, required: false, default: false },
  'with-now': { type: Boolean, required: false, default: false },
  min: { type: String, required: false, default: '' },
  max: { type: String, required: false, default: '' },
  step: { type: Number, required: false, default: 60 },
  'hour-format': { type: String, required: false, default: 'auto' },
  open: { type: Boolean, required: false, default: false },
  placement: { type: String, required: false, default: 'bottom-start' },
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
  'input',
  'change',
  'focus',
  'blur',
  'wa-clear',
  'wa-show',
  'wa-after-show',
  'wa-hide',
  'wa-after-hide',
  'wa-invalid',
]);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleInput = (e) => emit('input', e);
const handleChange = (e) => emit('change', e);
const handleFocus = (e) => emit('focus', e);
const handleBlur = (e) => emit('blur', e);
const handleWaClear = (e) => emit('wa-clear', e);
const handleWaShow = (e) => emit('wa-show', e);
const handleWaAfterShow = (e) => emit('wa-after-show', e);
const handleWaHide = (e) => emit('wa-hide', e);
const handleWaAfterHide = (e) => emit('wa-after-hide', e);
const handleWaInvalid = (e) => emit('wa-invalid', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('input', handleInput);
  el.addEventListener('change', handleChange);
  el.addEventListener('focus', handleFocus);
  el.addEventListener('blur', handleBlur);
  el.addEventListener('wa-clear', handleWaClear);
  el.addEventListener('wa-show', handleWaShow);
  el.addEventListener('wa-after-show', handleWaAfterShow);
  el.addEventListener('wa-hide', handleWaHide);
  el.addEventListener('wa-after-hide', handleWaAfterHide);
  el.addEventListener('wa-invalid', handleWaInvalid);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('input', handleInput);
  el.removeEventListener('change', handleChange);
  el.removeEventListener('focus', handleFocus);
  el.removeEventListener('blur', handleBlur);
  el.removeEventListener('wa-clear', handleWaClear);
  el.removeEventListener('wa-show', handleWaShow);
  el.removeEventListener('wa-after-show', handleWaAfterShow);
  el.removeEventListener('wa-hide', handleWaHide);
  el.removeEventListener('wa-after-hide', handleWaAfterHide);
  el.removeEventListener('wa-invalid', handleWaInvalid);
});

defineExpose({
  focus: (options) => elementRef.value?.focus?.(options),
  blur: () => elementRef.value?.blur?.(),
  show: () => elementRef.value?.show?.(),
  hide: () => elementRef.value?.hide?.(),
  formStateRestoreCallback: (state) =>
    elementRef.value?.formStateRestoreCallback?.(state),
  setCustomValidity: (message) =>
    elementRef.value?.setCustomValidity?.(message),
  resetValidity: () => elementRef.value?.resetValidity?.(),
  element: elementRef,
});
</script>

<template>
  <wa-time-input ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-time-input>
</template>
