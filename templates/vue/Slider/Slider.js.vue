<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import './Slider.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/slider/slider.js'));
}

/**
 * Sliders allow the user to select a value within a range
 */
const props = defineProps({
    name: { type: String, required: false, default: '' },
    label: { type: String, required: false, default: '' },
    hint: { type: String, required: false, default: '' },
    min: { type: Number, required: false, default: 0 },
    max: { type: Number, required: false, default: 100 },
    step: { type: Number, required: false, default: 1 },
    orientation: { type: String, required: false, default: 'horizontal' },
    disabled: { type: Boolean, required: false, default: false },
    readonly: { type: Boolean, required: false, default: false },
    range: { type: Boolean, required: false, default: false },
    'with-markers': { type: Boolean, required: false, default: false },
    'with-tooltip': { type: Boolean, required: false, default: true },
    size: { type: String, required: false, default: 'medium' },
    autofocus: { type: Boolean, required: false, default: false }
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

const emit = defineEmits(['change', 'blur', 'focus', 'input', 'wa-invalid']);

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
const handleBlur = (e) => emit('blur', e);
const handleFocus = (e) => emit('focus', e);
const handleInput = (e) => { model.value = e.target.value; emit('input', e); };
const handleWaInvalid = (e) => emit('wa-invalid', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('change', handleChange);
  el.addEventListener('blur', handleBlur);
  el.addEventListener('focus', handleFocus);
  el.addEventListener('input', handleInput);
  el.addEventListener('wa-invalid', handleWaInvalid);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('change', handleChange);
  el.removeEventListener('blur', handleBlur);
  el.removeEventListener('focus', handleFocus);
  el.removeEventListener('input', handleInput);
  el.removeEventListener('wa-invalid', handleWaInvalid);
});

defineExpose({
  focus: () => elementRef.value?.focus?.(),
  blur: () => elementRef.value?.blur?.(),
  stepDown: () => elementRef.value?.stepDown?.(),
  stepUp: () => elementRef.value?.stepUp?.(),
  setCustomValidity: (message) => elementRef.value?.setCustomValidity?.(message),
  formStateRestoreCallback: (state, reason) => elementRef.value?.formStateRestoreCallback?.(state, reason),
  resetValidity: () => elementRef.value?.resetValidity?.(),
  element: elementRef,
});
</script>

<template>
  <wa-slider
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
    :value="model"
  >
    <slot />
  </wa-slider>
</template>
