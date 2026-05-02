<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
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
    v-bind="definedProps"
    :class="$attrs.class"
    :value="model"
  >
    <slot />
  </wa-select>
</template>
