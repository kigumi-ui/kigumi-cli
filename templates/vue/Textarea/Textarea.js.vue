<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import './Textarea.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/textarea/textarea.js'));
}

/**
 * Textareas collect multi-line text data from the user
 */
const props = defineProps({
    name: { type: String, required: false },
    appearance: { type: String, required: false, default: 'outlined' },
    size: { type: String, required: false, default: 'medium' },
    label: { type: String, required: false, default: '' },
    hint: { type: String, required: false, default: '' },
    placeholder: { type: String, required: false, default: '' },
    rows: { type: Number, required: false, default: 4 },
    resize: { type: String, required: false, default: 'vertical' },
    disabled: { type: Boolean, required: false, default: false },
    readonly: { type: Boolean, required: false, default: false },
    required: { type: Boolean, required: false, default: false },
    minlength: { type: Number, required: false },
    maxlength: { type: Number, required: false },
    spellcheck: { type: Boolean, required: false, default: true },
    'with-count': { type: Boolean, required: false, default: false }
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

const emit = defineEmits(['blur', 'change', 'focus', 'input', 'wa-invalid']);

const model = defineModel();

const elementRef = ref(null);

watch(model, (val) => {
  const el = elementRef.value;
  if (el && el.value !== val) el.value = val ?? '';
});

onMounted(() => {
  ensureLoaded();
});

const handleBlur = (e) => emit('blur', e);
const handleChange = (e) => emit('change', e);
const handleFocus = (e) => emit('focus', e);
const handleInput = (e) => { model.value = e.target.value; emit('input', e); };
const handleWaInvalid = (e) => emit('wa-invalid', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('blur', handleBlur);
  el.addEventListener('change', handleChange);
  el.addEventListener('focus', handleFocus);
  el.addEventListener('input', handleInput);
  el.addEventListener('wa-invalid', handleWaInvalid);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('blur', handleBlur);
  el.removeEventListener('change', handleChange);
  el.removeEventListener('focus', handleFocus);
  el.removeEventListener('input', handleInput);
  el.removeEventListener('wa-invalid', handleWaInvalid);
});

defineExpose({
  focus: (options) => elementRef.value?.focus?.(options),
  blur: () => elementRef.value?.blur?.(),
  select: () => elementRef.value?.select?.(),
  scrollPosition: (position) => elementRef.value?.scrollPosition?.(position),
  setSelectionRange: (selectionStart, selectionEnd, selectionDirection) => elementRef.value?.setSelectionRange?.(selectionStart, selectionEnd, selectionDirection),
  setRangeText: (replacement, start, end, selectMode) => elementRef.value?.setRangeText?.(replacement, start, end, selectMode),
  setCustomValidity: (message) => elementRef.value?.setCustomValidity?.(message),
  formStateRestoreCallback: (state, reason) => elementRef.value?.formStateRestoreCallback?.(state, reason),
  resetValidity: () => elementRef.value?.resetValidity?.(),
  element: elementRef,
});
</script>

<template>
  <wa-textarea
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
    :value="model"
  >
    <slot />
  </wa-textarea>
</template>
