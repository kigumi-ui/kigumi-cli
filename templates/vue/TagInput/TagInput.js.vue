<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import './TagInput.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/tag-input/tag-input.js'));
}

/**
 * Tag inputs collect a list of short values, such as keywords or labels, as removable tags
 */
const props = defineProps({
  label: { type: String, required: false, default: '' },
  hint: { type: String, required: false, default: '' },
  placeholder: { type: String, required: false, default: '' },
  delimiter: { type: String, required: false, default: ',' },
  'max-tags': { type: Number, required: false },
  'min-tags': { type: Number, required: false },
  'allow-duplicates': { type: Boolean, required: false, default: false },
  'with-clear': { type: Boolean, required: false, default: false },
  appearance: { type: String, required: false, default: 'outlined' },
  size: { type: String, required: false, default: 'medium' },
  pill: { type: Boolean, required: false, default: false },
  required: { type: Boolean, required: false, default: false },
  readonly: { type: Boolean, required: false, default: false },
  disabled: { type: Boolean, required: false, default: false },
  name: { type: String, required: false },
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
  'blur',
  'focus',
  'wa-create',
  'wa-clear',
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
const handleBlur = (e) => emit('blur', e);
const handleFocus = (e) => emit('focus', e);
const handleWaCreate = (e) => emit('wa-create', e);
const handleWaClear = (e) => emit('wa-clear', e);
const handleWaInvalid = (e) => emit('wa-invalid', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('input', handleInput);
  el.addEventListener('change', handleChange);
  el.addEventListener('blur', handleBlur);
  el.addEventListener('focus', handleFocus);
  el.addEventListener('wa-create', handleWaCreate);
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
  el.removeEventListener('wa-create', handleWaCreate);
  el.removeEventListener('wa-clear', handleWaClear);
  el.removeEventListener('wa-invalid', handleWaInvalid);
});

defineExpose({
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
  <wa-tag-input
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
    :value="model"
  >
    <slot />
  </wa-tag-input>
</template>
