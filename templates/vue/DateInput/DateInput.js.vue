<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './DateInput.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/date-input/date-input.js'));
}

/**
 * A segmented date field with an optional popup calendar, for use in forms
 */
const props = defineProps({
  name: { type: String, required: false },
  value: { type: String, required: false },
  mode: { type: String, required: false, default: 'single' },
  label: { type: String, required: false },
  hint: { type: String, required: false },
  size: { type: String, required: false, default: 'm' },
  appearance: { type: String, required: false, default: 'outlined' },
  pill: { type: Boolean, required: false, default: false },
  required: { type: Boolean, required: false, default: false },
  readonly: { type: Boolean, required: false, default: false },
  disabled: { type: Boolean, required: false, default: false },
  autocomplete: { type: String, required: false },
  'with-clear': { type: Boolean, required: false, default: false },
  min: { type: String, required: false },
  max: { type: String, required: false },
  today: { type: String, required: false },
  'first-day-of-week': { type: String, required: false, default: 'auto' },
  'disabled-dates': { type: String, required: false },
  'disabled-days-of-week': { type: String, required: false },
  'disable-past': { type: Boolean, required: false, default: false },
  'disable-future': { type: Boolean, required: false, default: false },
  'min-range': { type: Number, required: false, default: 0 },
  'max-range': { type: Number, required: false, default: 0 },
  months: { type: Number, required: false, default: 1 },
  'page-by': { type: String, required: false, default: 'months' },
  'with-outside-days': { type: Boolean, required: false, default: false },
  'with-week-numbers': { type: Boolean, required: false, default: false },
  'weekday-format': { type: String, required: false, default: 'short' },
  open: { type: Boolean, required: false, default: false },
  placement: { type: String, required: false, default: 'bottom-start' },
  distance: { type: Number, required: false, default: 0 },
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
  clear: () => elementRef.value?.clear?.(),
  formStateRestoreCallback: (state) =>
    elementRef.value?.formStateRestoreCallback?.(state),
  setCustomValidity: (message) =>
    elementRef.value?.setCustomValidity?.(message),
  resetValidity: () => elementRef.value?.resetValidity?.(),
  element: elementRef,
});
</script>

<template>
  <wa-date-input ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-date-input>
</template>
