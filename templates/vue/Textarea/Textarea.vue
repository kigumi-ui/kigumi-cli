<script setup lang="ts">
import { ref, onMounted, useAttrs, onBeforeUnmount, watch } from 'vue';
import type WaTextarea from '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import type { WaInvalidEvent } from '@awesome.me/webawesome/dist/events/invalid.js';
import './Textarea.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/textarea/textarea.js'));
}

/**
 * Textareas collect multi-line text data from the user
 */
export interface TextareaProps {
  name?: string;
  appearance?: 'filled' | 'outlined' | 'filled-outlined';
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';
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
  title?: string;
  autocomplete?: string;
  autocapitalize?: 'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters';
  autofocus?: boolean;
  enterkeyhint?:
    'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
  inputmode?:
    | 'none'
    | 'text'
    | 'decimal'
    | 'numeric'
    | 'tel'
    | 'search'
    | 'email'
    | 'url';
  autocorrect?: boolean;
  'custom-error'?: string;
}

const props = withDefaults(defineProps<TextareaProps>(), {
  spellcheck: undefined,
  autocorrect: undefined,
});

defineOptions({ inheritAttrs: false });

// Web Awesome reads these as enumerated attributes, not by presence:
// `false` is written as its keyword rather than dropped.
const ENUMERATED_ATTRIBUTES: Record<string, { true: string; false: string }> = {
  spellcheck: { true: 'true', false: 'false' },
  autocorrect: { true: 'on', false: 'off' },
};

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
    const keywords = ENUMERATED_ATTRIBUTES[key];
    if (keywords && value !== undefined) {
      result[`^${key}`] = value ? keywords.true : keywords.false;
      continue;
    }
    if (value === undefined || value === false) continue;
    result[key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)] = value;
  }
  return result;
}

const emit = defineEmits<{
  blur: [event: FocusEvent];
  change: [event: Event];
  focus: [event: FocusEvent];
  input: [event: InputEvent];
  'wa-invalid': [event: WaInvalidEvent];
}>();

const model = defineModel<string>();

const elementRef = ref<WaTextarea | null>(null);

watch(model, (val) => {
  const el = elementRef.value as (HTMLElement & { value: unknown }) | null;
  if (el && el.value !== val) el.value = val ?? '';
});

onMounted(() => {
  ensureLoaded();
});

const handleBlur = (e: Event) => emit('blur', e as FocusEvent);
const handleChange = (e: Event) => emit('change', e as Event);
const handleFocus = (e: Event) => emit('focus', e as FocusEvent);
const handleInput = (e: Event) => {
  model.value = (e.target as HTMLElement & { value: string }).value;
  emit('input', e as InputEvent);
};
const handleWaInvalid = (e: Event) => emit('wa-invalid', e as WaInvalidEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('blur', handleBlur);
  el.addEventListener('change', handleChange);
  el.addEventListener('focus', handleFocus);
  el.addEventListener('input', handleInput);
  el.addEventListener('wa-invalid', handleWaInvalid);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('blur', handleBlur);
  el.removeEventListener('change', handleChange);
  el.removeEventListener('focus', handleFocus);
  el.removeEventListener('input', handleInput);
  el.removeEventListener('wa-invalid', handleWaInvalid);
});

defineExpose({
  focus: (options: FocusOptions) => elementRef.value?.focus?.(options),
  blur: () => elementRef.value?.blur?.(),
  select: () => elementRef.value?.select?.(),
  scrollPosition: (position: { top?: number; left?: number }) =>
    elementRef.value?.scrollPosition?.(position),
  setSelectionRange: (
    selectionStart: number,
    selectionEnd: number,
    selectionDirection: 'forward' | 'backward' | 'none'
  ) =>
    elementRef.value?.setSelectionRange?.(
      selectionStart,
      selectionEnd,
      selectionDirection
    ),
  setRangeText: (
    replacement: string,
    start: number,
    end: number,
    selectMode: 'select' | 'start' | 'end' | 'preserve'
  ) => elementRef.value?.setRangeText?.(replacement, start, end, selectMode),
  setCustomValidity: (message: string) =>
    elementRef.value?.setCustomValidity?.(message),
  formStateRestoreCallback: (
    state: string | File | FormData | null,
    reason: 'autocomplete' | 'restore'
  ) => elementRef.value?.formStateRestoreCallback?.(state, reason),
  resetValidity: () => elementRef.value?.resetValidity?.(),
  element: elementRef,
});
</script>

<template>
  <wa-textarea
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
    :value="model"
  >
    <slot />
  </wa-textarea>
</template>
