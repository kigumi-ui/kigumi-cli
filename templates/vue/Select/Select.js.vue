<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount, watch } from 'vue';
import './Select.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/select/select.js'));
}

/**
 * Selects allow you to choose items from a menu of predefined options
 */
const props = defineProps({
  name: { type: String, required: false, default: '' },
  appearance: { type: String, required: false, default: 'outlined' },
  size: { type: String, required: false, default: 'medium' },
  placeholder: { type: String, required: false, default: '' },
  multiple: { type: Boolean, required: false, default: false },
  'max-options-visible': { type: Number, required: false, default: 3 },
  disabled: { type: Boolean, required: false, default: false },
  'with-clear': { type: Boolean, required: false, default: false },
  open: { type: Boolean, required: false, default: false },
  hoist: { type: Boolean, required: false, default: false },
  placement: { type: String, required: false, default: 'bottom' },
  pill: { type: Boolean, required: false, default: false },
  label: { type: String, required: false, default: '' },
  hint: { type: String, required: false, default: '' },
  required: { type: Boolean, required: false, default: false },
  invalid: { type: Boolean, required: false, default: false },
  'help-text': { type: String, required: false, default: '' },
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

const model = defineModel();

const elementRef = ref(null);

watch(model, (val) => {
  const el = elementRef.value;
  if (el && el.value !== val) el.value = val ?? '';
});

onMounted(() => {
  ensureLoaded();
});

const handleInput = (e) => {
  model.value = e.target.value;
  emit('input', e);
};
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
  show: () => elementRef.value?.show?.(),
  hide: () => elementRef.value?.hide?.(),
  focus: (options) => elementRef.value?.focus?.(options),
  blur: () => elementRef.value?.blur?.(),
  setCustomValidity: (message) =>
    elementRef.value?.setCustomValidity?.(message),
  formStateRestoreCallback: (state, reason) =>
    elementRef.value?.formStateRestoreCallback?.(state, reason),
  resetValidity: () => elementRef.value?.resetValidity?.(),
  element: elementRef,
});
</script>

<template>
  <wa-select
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
    :value="model"
  >
    <slot />
  </wa-select>
</template>
