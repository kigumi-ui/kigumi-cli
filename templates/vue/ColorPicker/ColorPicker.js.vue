<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount, watch } from 'vue';
import './ColorPicker.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/color-picker/color-picker.js'));
}

/**
 * Color pickers allow the user to select a color
 */
const props = defineProps({
  format: { type: String, required: false, default: 'hex' },
  opacity: { type: Boolean, required: false, default: false },
  disabled: { type: Boolean, required: false, default: false },
  required: { type: Boolean, required: false, default: false },
  size: { type: String, required: false, default: 'medium' },
  label: { type: String, required: false, default: '' },
  hint: { type: String, required: false, default: '' },
  name: { type: String, required: false },
  open: { type: Boolean, required: false, default: false },
  placement: { type: String, required: false, default: 'bottom-start' },
  swatches: { type: String, required: false, default: '' },
  uppercase: { type: Boolean, required: false, default: false },
  'without-format-toggle': { type: Boolean, required: false, default: false },
  inline: { type: Boolean, required: false, default: false },
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
  'change',
  'input',
  'wa-show',
  'wa-after-show',
  'wa-hide',
  'wa-after-hide',
  'blur',
  'focus',
  'wa-invalid',
]);

const model = defineModel();

const elementRef = ref(null);

watch(model, (val) => {
  const el = elementRef.value;
  if (el && el.value !== val) el.value = val ?? '';
});

onMounted(() => {
  ensureLoaded();
});

const handleChange = (e) => emit('change', e);
const handleInput = (e) => {
  model.value = e.target.value;
  emit('input', e);
};
const handleWaShow = (e) => emit('wa-show', e);
const handleWaAfterShow = (e) => emit('wa-after-show', e);
const handleWaHide = (e) => emit('wa-hide', e);
const handleWaAfterHide = (e) => emit('wa-after-hide', e);
const handleBlur = (e) => emit('blur', e);
const handleFocus = (e) => emit('focus', e);
const handleWaInvalid = (e) => emit('wa-invalid', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('change', handleChange);
  el.addEventListener('input', handleInput);
  el.addEventListener('wa-show', handleWaShow);
  el.addEventListener('wa-after-show', handleWaAfterShow);
  el.addEventListener('wa-hide', handleWaHide);
  el.addEventListener('wa-after-hide', handleWaAfterHide);
  el.addEventListener('blur', handleBlur);
  el.addEventListener('focus', handleFocus);
  el.addEventListener('wa-invalid', handleWaInvalid);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('change', handleChange);
  el.removeEventListener('input', handleInput);
  el.removeEventListener('wa-show', handleWaShow);
  el.removeEventListener('wa-after-show', handleWaAfterShow);
  el.removeEventListener('wa-hide', handleWaHide);
  el.removeEventListener('wa-after-hide', handleWaAfterHide);
  el.removeEventListener('blur', handleBlur);
  el.removeEventListener('focus', handleFocus);
  el.removeEventListener('wa-invalid', handleWaInvalid);
});

defineExpose({
  getHexString: (hue, saturation, brightness, alpha) =>
    elementRef.value?.getHexString?.(hue, saturation, brightness, alpha),
  focus: (options) => elementRef.value?.focus?.(options),
  blur: () => elementRef.value?.blur?.(),
  getFormattedValue: (format) => elementRef.value?.getFormattedValue?.(format),
  reportValidity: () => elementRef.value?.reportValidity?.(),
  show: () => elementRef.value?.show?.(),
  hide: () => elementRef.value?.hide?.(),
  setCustomValidity: (message) =>
    elementRef.value?.setCustomValidity?.(message),
  formStateRestoreCallback: (state, reason) =>
    elementRef.value?.formStateRestoreCallback?.(state, reason),
  resetValidity: () => elementRef.value?.resetValidity?.(),
  element: elementRef,
});
</script>

<template>
  <wa-color-picker
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
    :value="model"
  >
    <slot />
  </wa-color-picker>
</template>
