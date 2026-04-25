<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './Button.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/button/button.js'));
}

/**
 * Buttons represent actions that are available to the user
 */
export interface ButtonProps {
  variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
  appearance?: 'accent' | 'filled-outlined' | 'filled' | 'outlined' | 'plain';
  size?: 'small' | 'medium' | 'large';
  pill?: boolean;
  disabled?: boolean;
  loading?: boolean;
  'with-caret'?: boolean;
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  download?: string;
  rel?: string;
  type?: 'button' | 'submit' | 'reset';
  name?: string;
  value?: string;
  formaction?: string;
  formenctype?: string;
  formmethod?: string;
  formnovalidate?: boolean;
  formtarget?: string;
}

const props = defineProps<ButtonProps>();

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
  'focus': [event: FocusEvent];
  'wa-invalid': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleBlur = (e: Event) => emit('blur', e as CustomEvent);
const handleFocus = (e: Event) => emit('focus', e as FocusEvent);
const handleWaInvalid = (e: Event) => emit('wa-invalid', e as CustomEvent);

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
  click: () => (elementRef.value as any)?.click?.(),
  focus: (options: FocusOptions) => (elementRef.value as any)?.focus?.(options),
  blur: () => (elementRef.value as any)?.blur?.(),
  setCustomValidity: (message: string) => (elementRef.value as any)?.setCustomValidity?.(message),
  formStateRestoreCallback: (state: string | File | FormData | null, reason: 'autocomplete' | 'restore') => (elementRef.value as any)?.formStateRestoreCallback?.(state, reason),
  resetValidity: () => (elementRef.value as any)?.resetValidity?.(),
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
