<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './KnownDate.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/known-date/known-date.js'));
}

/**
 * Known dates collect a calendar date the user already knows, such as a birthday
 */
const props = defineProps({
  name: { type: String, required: false, default: '' },
  value: { type: String, required: false },
  disabled: { type: Boolean, required: false, default: false },
  required: { type: Boolean, required: false, default: false },
  readonly: { type: Boolean, required: false, default: false },
  size: { type: String, required: false, default: 'medium' },
  appearance: { type: String, required: false, default: 'outlined' },
  pill: { type: Boolean, required: false, default: false },
  label: { type: String, required: false, default: '' },
  hint: { type: String, required: false, default: '' },
  min: { type: String, required: false, default: '' },
  max: { type: String, required: false, default: '' },
  locale: { type: String, required: false, default: '' },
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

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleInput = (e) => emit('input', e);
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
  formStateRestoreCallback: (state) =>
    elementRef.value?.formStateRestoreCallback?.(state),
  setCustomValidity: (message) =>
    elementRef.value?.setCustomValidity?.(message),
  resetValidity: () => elementRef.value?.resetValidity?.(),
  element: elementRef,
});
</script>

<template>
  <wa-known-date ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-known-date>
</template>
