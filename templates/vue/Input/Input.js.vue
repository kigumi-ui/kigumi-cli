<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import './Input.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/input/input.js'));
}

/**
 * Inputs collect data from the user
 */
const props = defineProps({
    type: { type: String, required: false, default: 'text' },
    label: { type: String, required: false },
    hint: { type: String, required: false },
    placeholder: { type: String, required: false },
    appearance: { type: String, required: false, default: 'outlined' },
    size: { type: String, required: false, default: 'medium' },
    pill: { type: Boolean, required: false, default: false },
    disabled: { type: Boolean, required: false, default: false },
    'with-clear': { type: Boolean, required: false, default: false },
    'password-toggle': { type: Boolean, required: false, default: false },
    'password-visible': { type: Boolean, required: false, default: false },
    readonly: { type: Boolean, required: false, default: false },
    required: { type: Boolean, required: false, default: false },
    name: { type: String, required: false },
    pattern: { type: String, required: false },
    minlength: { type: Number, required: false },
    maxlength: { type: Number, required: false },
    min: { type: String, required: false },
    max: { type: String, required: false },
    step: { type: String, required: false },
    'without-spin-buttons': { type: Boolean, required: false, default: false },
    autocomplete: { type: String, required: false },
    autocapitalize: { type: String, required: false },
    autocorrect: { type: Boolean, required: false, default: false },
    autofocus: { type: Boolean, required: false, default: false },
    inputmode: { type: String, required: false },
    enterkeyhint: { type: String, required: false }
});

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
});

const emit = defineEmits(['input', 'change', 'blur', 'focus', 'wa-clear', 'wa-invalid']);

const model = defineModel();

const elementRef = ref(null);

watch(model, (val) => {
  const el = elementRef.value;
  if (el && el.value !== val) el.value = val ?? '';
});

onMounted(() => {
  ensureLoaded();
});

const handleInput = (e) => { model.value = e.target.value; emit('input', e); };
const handleChange = (e) => emit('change', e);
const handleBlur = (e) => emit('blur', e);
const handleFocus = (e) => emit('focus', e);
const handleWaClear = (e) => emit('wa-clear', e);
const handleWaInvalid = (e) => emit('wa-invalid', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('input', handleInput);
  el.addEventListener('change', handleChange);
  el.addEventListener('blur', handleBlur);
  el.addEventListener('focus', handleFocus);
  el.addEventListener('wa-clear', handleWaClear);
  el.addEventListener('wa-invalid', handleWaInvalid);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('input', handleInput);
  el.removeEventListener('change', handleChange);
  el.removeEventListener('blur', handleBlur);
  el.removeEventListener('focus', handleFocus);
  el.removeEventListener('wa-clear', handleWaClear);
  el.removeEventListener('wa-invalid', handleWaInvalid);
});

defineExpose({
  focus: (options) => elementRef.value?.focus?.(options),
  blur: () => elementRef.value?.blur?.(),
  select: () => elementRef.value?.select?.(),
  setSelectionRange: (selectionStart, selectionEnd, selectionDirection) => elementRef.value?.setSelectionRange?.(selectionStart, selectionEnd, selectionDirection),
  setRangeText: (replacement, start, end, selectMode) => elementRef.value?.setRangeText?.(replacement, start, end, selectMode),
  showPicker: () => elementRef.value?.showPicker?.(),
  stepUp: () => elementRef.value?.stepUp?.(),
  stepDown: () => elementRef.value?.stepDown?.(),
  setCustomValidity: (message) => elementRef.value?.setCustomValidity?.(message),
  formStateRestoreCallback: (state, reason) => elementRef.value?.formStateRestoreCallback?.(state, reason),
  resetValidity: () => elementRef.value?.resetValidity?.(),
  element: elementRef,
});
</script>

<template>
  <wa-input
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
    :value="model"
  >
    <slot />
  </wa-input>
</template>
