<script setup lang="ts">
import { ref, onMounted, useAttrs, onBeforeUnmount, watch } from 'vue';
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
  change: [event: Event];
  input: [event: InputEvent];
  blur: [event: FocusEvent];
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
  emit('change', e as Event);
};
const handleInput = (e: Event) => emit('input', e as InputEvent);
const handleBlur = (e: Event) => emit('blur', e as FocusEvent);
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

onBeforeUnmount(() => {
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
    v-bind="hostAttributes()"
    :class="$attrs.class"
    :checked="model || undefined"
  >
    <slot />
  </wa-switch>
</template>
