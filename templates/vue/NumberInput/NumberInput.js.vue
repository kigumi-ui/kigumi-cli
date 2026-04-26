<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import './NumberInput.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/number-input/number-input.js'));
}

/**
 * Number inputs allow users to enter numeric values with optional step controls
 */
const props = defineProps({
    label: { type: String, required: false },
    hint: { type: String, required: false },
    min: { type: Number, required: false },
    max: { type: Number, required: false },
    step: { type: Number, required: false, default: 1 },
    disabled: { type: Boolean, required: false, default: false },
    required: { type: Boolean, required: false, default: false },
    placeholder: { type: String, required: false },
    size: { type: String, required: false, default: 'medium' },
    appearance: { type: String, required: false, default: 'outlined' },
    'without-steppers': { type: Boolean, required: false, default: false }
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

const emit = defineEmits(['input', 'change', 'blur', 'focus', 'wa-invalid']);

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
const handleWaInvalid = (e) => emit('wa-invalid', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('input', handleInput);
  el.addEventListener('change', handleChange);
  el.addEventListener('blur', handleBlur);
  el.addEventListener('focus', handleFocus);
  el.addEventListener('wa-invalid', handleWaInvalid);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('input', handleInput);
  el.removeEventListener('change', handleChange);
  el.removeEventListener('blur', handleBlur);
  el.removeEventListener('focus', handleFocus);
  el.removeEventListener('wa-invalid', handleWaInvalid);
});

defineExpose({
  focus: (options) => elementRef.value?.focus?.(options),
  blur: () => elementRef.value?.blur?.(),
  select: () => elementRef.value?.select?.(),
  stepUp: () => elementRef.value?.stepUp?.(),
  stepDown: () => elementRef.value?.stepDown?.(),
  setCustomValidity: (message) => elementRef.value?.setCustomValidity?.(message),
  formStateRestoreCallback: (state, reason) => elementRef.value?.formStateRestoreCallback?.(state, reason),
  resetValidity: () => elementRef.value?.resetValidity?.(),
  element: elementRef,
});
</script>

<template>
  <wa-number-input
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
    :value="model"
  >
    <slot />
  </wa-number-input>
</template>
