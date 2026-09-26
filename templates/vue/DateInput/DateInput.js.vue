<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
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

defineOptions({ inheritAttrs: false });

// Forward props and fallthrough attributes to the web component yourself,
// rather than through Vue's default fallthrough:
// - Web Awesome reads attribute presence as truthy, so `false` must never
//   reach <wa-*>. Vue materializes every absent optional Boolean prop as
//   `false`, and would render a fallthrough `false` as the string "false".
//   `aria-*` / `data-*` keep `false`, where "false" is a real value.
// - Vue camelizes declared prop keys (`with-caret` -> `withCaret`). Before
//   the element upgrades, that key lands as the attribute `withcaret`, which
//   Web Awesome never reads, so props go back to their kebab-case names.
// A plain function, not `computed`: `attrs` is tracked per property read,
// so a computed over an empty `attrs` would never see a later attribute.
const attrs = useAttrs();

function hostAttributes() {
  const result = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') continue;
    if (value === false && !/^(aria|data)-/.test(key)) continue;
    result[key] = value;
  }
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === false) continue;
    result[key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)] = value;
  }
  return result;
}

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

onBeforeUnmount(() => {
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
  <wa-date-input
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
  >
    <slot />
  </wa-date-input>
</template>
