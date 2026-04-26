<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import './Input.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/input/input.js'));
}

/**
 * Inputs collect data from the user
 */
export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'tel' | 'url' | 'search';
  label?: string;
  hint?: string;
  placeholder?: string;
  appearance?: 'filled' | 'filled-outlined' | 'outlined';
  size?: 'small' | 'medium' | 'large';
  pill?: boolean;
  disabled?: boolean;
  'with-clear'?: boolean;
  'password-toggle'?: boolean;
  'password-visible'?: boolean;
  readonly?: boolean;
  required?: boolean;
  name?: string;
  pattern?: string;
  minlength?: number;
  maxlength?: number;
  min?: string;
  max?: string;
  step?: string;
  'without-spin-buttons'?: boolean;
  autocomplete?: string;
  autocapitalize?: 'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters';
  autocorrect?: boolean;
  autofocus?: boolean;
  inputmode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
  enterkeyhint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
}

const props = defineProps<InputProps>();

// Strip undefined and false props before forwarding to the web component.
// Vue boolean-prop coercion materializes absent optional Boolean props as
// `false`, but Web Awesome elements read attribute presence as truthy, so
// we must not forward `false` to <wa-*> (would render pill="" / loading="").
const definedProps = computed(() => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
    if (value !== undefined && value !== false) result[key] = value;
  }
  return result;
});

const emit = defineEmits<{
  'input': [event: CustomEvent];
  'change': [event: CustomEvent];
  'blur': [event: CustomEvent];
  'focus': [event: FocusEvent];
  'wa-clear': [event: CustomEvent];
  'wa-invalid': [event: CustomEvent];
}>();

const model = defineModel<string>();

const elementRef = ref<HTMLElement | null>(null);

watch(model, (val) => {
  const el = elementRef.value as any;
  if (el && el.value !== val) el.value = val ?? '';
});

onMounted(() => {
  ensureLoaded();
});

const handleInput = (e: Event) => { model.value = (e.target as any).value; emit('input', e as CustomEvent); };
const handleChange = (e: Event) => emit('change', e as CustomEvent);
const handleBlur = (e: Event) => emit('blur', e as CustomEvent);
const handleFocus = (e: Event) => emit('focus', e as FocusEvent);
const handleWaClear = (e: Event) => emit('wa-clear', e as CustomEvent);
const handleWaInvalid = (e: Event) => emit('wa-invalid', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('input', handleInput);
  el.addEventListener('change', handleChange);
  el.addEventListener('blur', handleBlur);
  el.addEventListener('focus', handleFocus);
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
  el.removeEventListener('wa-clear', handleWaClear);
  el.removeEventListener('wa-invalid', handleWaInvalid);
});

defineExpose({
  focus: (options: FocusOptions) => (elementRef.value as any)?.focus?.(options),
  blur: () => (elementRef.value as any)?.blur?.(),
  select: () => (elementRef.value as any)?.select?.(),
  setSelectionRange: (selectionStart: number, selectionEnd: number, selectionDirection: 'forward' | 'backward' | 'none') => (elementRef.value as any)?.setSelectionRange?.(selectionStart, selectionEnd, selectionDirection),
  setRangeText: (replacement: string, start: number, end: number, selectMode: 'select' | 'start' | 'end' | 'preserve') => (elementRef.value as any)?.setRangeText?.(replacement, start, end, selectMode),
  showPicker: () => (elementRef.value as any)?.showPicker?.(),
  stepUp: () => (elementRef.value as any)?.stepUp?.(),
  stepDown: () => (elementRef.value as any)?.stepDown?.(),
  setCustomValidity: (message: string) => (elementRef.value as any)?.setCustomValidity?.(message),
  formStateRestoreCallback: (state: string | File | FormData | null, reason: 'autocomplete' | 'restore') => (elementRef.value as any)?.formStateRestoreCallback?.(state, reason),
  resetValidity: () => (elementRef.value as any)?.resetValidity?.(),
  element: elementRef,
});
</script>

<template>
  <wa-input
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
    :value="model"
  >
    <slot />
  </wa-input>
</template>
