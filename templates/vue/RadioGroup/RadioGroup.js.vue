<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import './RadioGroup.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/radio-group/radio-group.js'));
}

/**
 * Radio groups are used to group multiple radios so only one can be selected
 */
const props = defineProps({
  label: { type: String, required: false, default: '' },
  hint: { type: String, required: false, default: '' },
  name: { type: String, required: false, default: 'option' },
  size: { type: String, required: false, default: 'medium' },
  required: { type: Boolean, required: false, default: false },
  orientation: { type: String, required: false, default: 'vertical' },
  disabled: { type: Boolean, required: false, default: false },
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

const emit = defineEmits(['input', 'change', 'wa-invalid']);

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
const handleWaInvalid = (e) => emit('wa-invalid', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('input', handleInput);
  el.addEventListener('change', handleChange);
  el.addEventListener('wa-invalid', handleWaInvalid);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('input', handleInput);
  el.removeEventListener('change', handleChange);
  el.removeEventListener('wa-invalid', handleWaInvalid);
});

defineExpose({
  focus: (options) => elementRef.value?.focus?.(options),
  setCustomValidity: (message) =>
    elementRef.value?.setCustomValidity?.(message),
  formStateRestoreCallback: (state, reason) =>
    elementRef.value?.formStateRestoreCallback?.(state, reason),
  resetValidity: () => elementRef.value?.resetValidity?.(),
  element: elementRef,
});
</script>

<template>
  <wa-radio-group
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
    :value="model"
  >
    <slot />
  </wa-radio-group>
</template>
