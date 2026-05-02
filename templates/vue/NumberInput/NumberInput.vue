<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import './NumberInput.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/number-input/number-input.js'));
}

/**
 * Number inputs allow users to enter numeric values with optional step controls
 */
export interface NumberInputProps {
  label?: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  size?: 'small' | 'medium' | 'large';
  appearance?: 'filled' | 'outlined' | 'filled-outlined';
  'without-steppers'?: boolean;
}

const props = defineProps<NumberInputProps>();

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
  input: [event: CustomEvent];
  change: [event: CustomEvent];
  blur: [event: CustomEvent];
  focus: [event: FocusEvent];
  'wa-invalid': [event: CustomEvent];
}>();

const model = defineModel<number>();

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
  emit('input', e as CustomEvent);
};
const handleChange = (e: Event) => emit('change', e as CustomEvent);
const handleBlur = (e: Event) => emit('blur', e as CustomEvent);
const handleFocus = (e: Event) => emit('focus', e as FocusEvent);
const handleWaInvalid = (e: Event) => emit('wa-invalid', e as CustomEvent);

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
  focus: (options: FocusOptions) => (elementRef.value as any)?.focus?.(options),
  blur: () => (elementRef.value as any)?.blur?.(),
  select: () => (elementRef.value as any)?.select?.(),
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
  <wa-number-input
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
    :value="model"
  >
    <slot />
  </wa-number-input>
</template>
