<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import './Textarea.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/textarea/textarea.js'));
}

/**
 * Textareas collect multi-line text data from the user
 */
export interface TextareaProps {
  name?: string;
  appearance?: 'filled' | 'outlined' | 'filled-outlined';
  size?: 'small' | 'medium' | 'large';
  label?: string;
  hint?: string;
  placeholder?: string;
  rows?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both' | 'auto';
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  minlength?: number;
  maxlength?: number;
  spellcheck?: boolean;
  'with-count'?: boolean;
}

const props = defineProps<TextareaProps>();

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
});

const emit = defineEmits<{
  'blur': [event: CustomEvent];
  'change': [event: CustomEvent];
  'focus': [event: FocusEvent];
  'input': [event: CustomEvent];
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

const handleBlur = (e: Event) => emit('blur', e as CustomEvent);
const handleChange = (e: Event) => emit('change', e as CustomEvent);
const handleFocus = (e: Event) => emit('focus', e as FocusEvent);
const handleInput = (e: Event) => { model.value = (e.target as any).value; emit('input', e as CustomEvent); };
const handleWaInvalid = (e: Event) => emit('wa-invalid', e as CustomEvent);

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
  focus: (options: FocusOptions) => (elementRef.value as any)?.focus?.(options),
  blur: () => (elementRef.value as any)?.blur?.(),
  select: () => (elementRef.value as any)?.select?.(),
  scrollPosition: (position: { top?: number; left?: number }) => (elementRef.value as any)?.scrollPosition?.(position),
  setSelectionRange: (selectionStart: number, selectionEnd: number, selectionDirection: 'forward' | 'backward' | 'none') => (elementRef.value as any)?.setSelectionRange?.(selectionStart, selectionEnd, selectionDirection),
  setRangeText: (replacement: string, start: number, end: number, selectMode: 'select' | 'start' | 'end' | 'preserve') => (elementRef.value as any)?.setRangeText?.(replacement, start, end, selectMode),
  setCustomValidity: (message: string) => (elementRef.value as any)?.setCustomValidity?.(message),
  formStateRestoreCallback: (state: string | File | FormData | null, reason: 'autocomplete' | 'restore') => (elementRef.value as any)?.formStateRestoreCallback?.(state, reason),
  resetValidity: () => (elementRef.value as any)?.resetValidity?.(),
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
