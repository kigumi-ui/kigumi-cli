<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import './Switch.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/switch/switch.js'));
}

/**
 * Switches allow the user to toggle an option on or off
 */
export interface SwitchProps {
  name?: string;
  value?: string;
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';
  disabled?: boolean;
  required?: boolean;
  hint?: string;
}

const props = defineProps<SwitchProps>();

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
  change: [event: CustomEvent];
  input: [event: CustomEvent];
  blur: [event: CustomEvent];
  focus: [event: FocusEvent];
  'wa-invalid': [event: CustomEvent];
}>();

const model = defineModel<boolean>({ default: false });

const elementRef = ref<HTMLElement | null>(null);

watch(model, (val) => {
  const el = elementRef.value as any;
  if (el && el.checked !== val) el.checked = val ?? false;
});

onMounted(() => {
  ensureLoaded();
});

const handleChange = (e: Event) => {
  model.value = (e.target as any).checked;
  emit('change', e as CustomEvent);
};
const handleInput = (e: Event) => emit('input', e as CustomEvent);
const handleBlur = (e: Event) => emit('blur', e as CustomEvent);
const handleFocus = (e: Event) => emit('focus', e as FocusEvent);
const handleWaInvalid = (e: Event) => emit('wa-invalid', e as CustomEvent);

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
  click: () => (elementRef.value as any)?.click?.(),
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
  <wa-switch
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
    :checked="model"
  >
    <slot />
  </wa-switch>
</template>
