<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount, watch } from 'vue';
import './Rating.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/rating/rating.js'));
}

/**
 * Ratings give users a way to quickly view and provide feedback
 */
const props = defineProps({
  label: { type: String, required: false, default: '' },
  max: { type: Number, required: false, default: 5 },
  precision: { type: Number, required: false, default: 1 },
  readonly: { type: Boolean, required: false, default: false },
  disabled: { type: Boolean, required: false, default: false },
  name: { type: String, required: false, default: '' },
  required: { type: Boolean, required: false, default: false },
  size: { type: String, required: false, default: 'medium' },
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

const emit = defineEmits(['change', 'wa-hover', 'wa-invalid']);

const model = defineModel();

const elementRef = ref(null);

watch(model, (val) => {
  const el = elementRef.value;
  if (el && el.value !== val) el.value = val ?? '';
});

onMounted(() => {
  ensureLoaded();
});

const handleChange = (e) => {
  model.value = e.target.value;
  emit('change', e);
};
const handleWaHover = (e) => emit('wa-hover', e);
const handleWaInvalid = (e) => emit('wa-invalid', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('change', handleChange);
  el.addEventListener('wa-hover', handleWaHover);
  el.addEventListener('wa-invalid', handleWaInvalid);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('change', handleChange);
  el.removeEventListener('wa-hover', handleWaHover);
  el.removeEventListener('wa-invalid', handleWaInvalid);
});

defineExpose({
  setCustomValidity: (message) =>
    elementRef.value?.setCustomValidity?.(message),
  formStateRestoreCallback: (state, reason) =>
    elementRef.value?.formStateRestoreCallback?.(state, reason),
  resetValidity: () => elementRef.value?.resetValidity?.(),
  element: elementRef,
});
</script>

<template>
  <wa-rating
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
    :value="model"
  >
    <slot />
  </wa-rating>
</template>
