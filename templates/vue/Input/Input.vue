<script setup lang="ts">
import { ref, onMounted, useAttrs, onBeforeUnmount, watch } from 'vue';
import './Input.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/input/input.js'));
}

/**
 * Inputs collect data from the user
 */
export interface InputProps {
  type?:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'date'
    | 'tel'
    | 'url'
    | 'search';
  label?: string;
  hint?: string;
  placeholder?: string;
  appearance?: 'filled' | 'filled-outlined' | 'outlined';
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';
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
  inputmode?:
    | 'none'
    | 'text'
    | 'decimal'
    | 'numeric'
    | 'tel'
    | 'search'
    | 'email'
    | 'url';
  enterkeyhint?:
    'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
}

const props = defineProps<InputProps>();

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

function hostAttributes(): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') continue;
    if (value === false && !/^(aria|data)-/.test(key)) continue;
    result[key] = value;
  }
  for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
    if (value === undefined || value === false) continue;
    result[key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)] = value;
  }
  return result;
}

const emit = defineEmits<{
  input: [event: InputEvent];
  change: [event: Event];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
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

const handleInput = (e: Event) => {
  model.value = (e.target as any).value;
  emit('input', e as InputEvent);
};
const handleChange = (e: Event) => emit('change', e as Event);
const handleBlur = (e: Event) => emit('blur', e as FocusEvent);
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

onBeforeUnmount(() => {
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
  setSelectionRange: (
    selectionStart: number,
    selectionEnd: number,
    selectionDirection: 'forward' | 'backward' | 'none'
  ) =>
    (elementRef.value as any)?.setSelectionRange?.(
      selectionStart,
      selectionEnd,
      selectionDirection
    ),
  setRangeText: (
    replacement: string,
    start: number,
    end: number,
    selectMode: 'select' | 'start' | 'end' | 'preserve'
  ) =>
    (elementRef.value as any)?.setRangeText?.(
      replacement,
      start,
      end,
      selectMode
    ),
  showPicker: () => (elementRef.value as any)?.showPicker?.(),
  stepUp: () => (elementRef.value as any)?.stepUp?.(),
  stepDown: () => (elementRef.value as any)?.stepDown?.(),
  setCustomValidity: (message: string) =>
    (elementRef.value as any)?.setCustomValidity?.(message),
  formStateRestoreCallback: (
    state: string | File | FormData | null,
    reason: 'autocomplete' | 'restore'
  ) => (elementRef.value as any)?.formStateRestoreCallback?.(state, reason),
  resetValidity: () => (elementRef.value as any)?.resetValidity?.(),
  element: elementRef,
});
</script>

<template>
  <wa-input
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
    :value="model"
  >
    <slot />
  </wa-input>
</template>
