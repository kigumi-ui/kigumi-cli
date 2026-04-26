<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import './Switch.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/switch/switch.js'));
}

/**
 * Switches allow the user to toggle an option on or off
 */
const props = defineProps({
    name: { type: String, required: false },
    value: { type: String, required: false },
    size: { type: String, required: false, default: 'medium' },
    disabled: { type: Boolean, required: false, default: false },
    required: { type: Boolean, required: false, default: false },
    hint: { type: String, required: false, default: '' }
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

const emit = defineEmits(['change', 'input', 'blur', 'focus', 'wa-invalid']);

const model = defineModel({ default: false });

const elementRef = ref(null);

watch(model, (val) => {
  const el = elementRef.value;
  if (el && el.checked !== val) el.checked = val ?? false;
});

onMounted(() => {
  ensureLoaded();
});

const handleChange = (e) => { model.value = e.target.checked; emit('change', e); };
const handleInput = (e) => emit('input', e);
const handleBlur = (e) => emit('blur', e);
const handleFocus = (e) => emit('focus', e);
const handleWaInvalid = (e) => emit('wa-invalid', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('change', handleChange);
  el.addEventListener('input', handleInput);
  el.addEventListener('blur', handleBlur);
  el.addEventListener('focus', handleFocus);
  el.addEventListener('wa-invalid', handleWaInvalid);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('change', handleChange);
  el.removeEventListener('input', handleInput);
  el.removeEventListener('blur', handleBlur);
  el.removeEventListener('focus', handleFocus);
  el.removeEventListener('wa-invalid', handleWaInvalid);
});

defineExpose({
  click: () => elementRef.value?.click?.(),
  focus: (options) => elementRef.value?.focus?.(options),
  blur: () => elementRef.value?.blur?.(),
  setCustomValidity: (message) => elementRef.value?.setCustomValidity?.(message),
  formStateRestoreCallback: (state, reason) => elementRef.value?.formStateRestoreCallback?.(state, reason),
  resetValidity: () => elementRef.value?.resetValidity?.(),
  element: elementRef,
});
</script>

<template>
  <wa-switch
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
    :checked="model"
  >
    <slot />
  </wa-switch>
</template>
