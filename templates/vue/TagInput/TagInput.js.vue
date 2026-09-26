<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount, watch } from 'vue';
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

onBeforeUnmount(() => {
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
    v-bind="hostAttributes()"
    :class="$attrs.class"
    :value="model"
  >
    <slot />
  </wa-tag-input>
</template>
