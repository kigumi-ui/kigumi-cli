<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import './TagInput.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/tag-input/tag-input.js'));
}

/**
 * Tag inputs collect a list of short values, such as keywords or labels, as removable tags
 */
export interface TagInputProps {
  label?: string;
  hint?: string;
  placeholder?: string;
  delimiter?: string;
  'max-tags'?: number;
  'min-tags'?: number;
  'allow-duplicates'?: boolean;
  'with-clear'?: boolean;
  appearance?: 'filled' | 'outlined' | 'filled-outlined';
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';
  pill?: boolean;
  required?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  name?: string;
}

const props = defineProps<TagInputProps>();

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
  input: [event: InputEvent];
  change: [event: Event];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
  'wa-create': [event: CustomEvent];
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
const handleWaCreate = (e: Event) => emit('wa-create', e as CustomEvent);
const handleWaClear = (e: Event) => emit('wa-clear', e as CustomEvent);
const handleWaInvalid = (e: Event) => emit('wa-invalid', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('input', handleInput);
  el.addEventListener('change', handleChange);
  el.addEventListener('blur', handleBlur);
  el.addEventListener('focus', handleFocus);
  el.addEventListener('wa-create', handleWaCreate);
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
  el.removeEventListener('wa-create', handleWaCreate);
  el.removeEventListener('wa-clear', handleWaClear);
  el.removeEventListener('wa-invalid', handleWaInvalid);
});

defineExpose({
  focus: (options: FocusOptions) => (elementRef.value as any)?.focus?.(options),
  blur: () => (elementRef.value as any)?.blur?.(),
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
  <wa-tag-input
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
    :value="model"
  >
    <slot />
  </wa-tag-input>
</template>
