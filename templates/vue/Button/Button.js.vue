<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './Button.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/button/button.js'));
}

/**
 * Buttons represent actions that are available to the user
 */
const props = defineProps({
    variant: { type: String, required: false, default: 'neutral' },
    appearance: { type: String, required: false, default: 'filled' },
    size: { type: String, required: false, default: 'medium' },
    pill: { type: Boolean, required: false, default: false },
    disabled: { type: Boolean, required: false, default: false },
    loading: { type: Boolean, required: false, default: false },
    'with-caret': { type: Boolean, required: false, default: false },
    href: { type: String, required: false },
    target: { type: String, required: false },
    download: { type: String, required: false },
    rel: { type: String, required: false },
    type: { type: String, required: false, default: 'button' },
    name: { type: String, required: false },
    value: { type: String, required: false },
    formaction: { type: String, required: false },
    formenctype: { type: String, required: false },
    formmethod: { type: String, required: false },
    formnovalidate: { type: Boolean, required: false, default: false },
    formtarget: { type: String, required: false }
});

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
});

const emit = defineEmits(['blur', 'focus', 'wa-invalid']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleBlur = (e) => emit('blur', e);
const handleFocus = (e) => emit('focus', e);
const handleWaInvalid = (e) => emit('wa-invalid', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('blur', handleBlur);
  el.addEventListener('focus', handleFocus);
  el.addEventListener('wa-invalid', handleWaInvalid);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

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
  <wa-button
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-button>
</template>
