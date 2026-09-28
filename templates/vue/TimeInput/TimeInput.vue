<script setup lang="ts">
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import type WaTimeInput from '@awesome.me/webawesome/dist/components/time-input/time-input.js';
import type { WaAfterHideEvent } from '@awesome.me/webawesome/dist/events/after-hide.js';
import type { WaAfterShowEvent } from '@awesome.me/webawesome/dist/events/after-show.js';
import type { WaClearEvent } from '@awesome.me/webawesome/dist/events/clear.js';
import type { WaHideEvent } from '@awesome.me/webawesome/dist/events/hide.js';
import type { WaInvalidEvent } from '@awesome.me/webawesome/dist/events/invalid.js';
import type { WaShowEvent } from '@awesome.me/webawesome/dist/events/show.js';
import './TimeInput.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/time-input/time-input.js'));
}

/**
 * Time inputs collect a time of day from the user
 */
export interface TimeInputProps {
  name?: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
  readonly?: boolean;
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';
  appearance?: 'filled' | 'outlined' | 'filled-outlined';
  pill?: boolean;
  label?: string;
  hint?: string;
  'with-clear'?: boolean;
  'with-now'?: boolean;
  min?: string;
  max?: string;
  step?: number;
  'hour-format'?: 'auto' | '12' | '24';
  open?: boolean;
  placement?:
    'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end';
  autocomplete?: string;
  'custom-error'?: string;
}

const props = defineProps<TimeInputProps>();

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
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  'wa-clear': [event: WaClearEvent];
  'wa-show': [event: WaShowEvent];
  'wa-after-show': [event: WaAfterShowEvent];
  'wa-hide': [event: WaHideEvent];
  'wa-after-hide': [event: WaAfterHideEvent];
  'wa-invalid': [event: WaInvalidEvent];
}>();

const elementRef = ref<WaTimeInput | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleInput = (e: Event) => emit('input', e as InputEvent);
const handleChange = (e: Event) => emit('change', e);
const handleFocus = (e: Event) => emit('focus', e as FocusEvent);
const handleBlur = (e: Event) => emit('blur', e as FocusEvent);
const handleWaClear = (e: Event) => emit('wa-clear', e as WaClearEvent);
const handleWaShow = (e: Event) => emit('wa-show', e as WaShowEvent);
const handleWaAfterShow = (e: Event) =>
  emit('wa-after-show', e as WaAfterShowEvent);
const handleWaHide = (e: Event) => emit('wa-hide', e as WaHideEvent);
const handleWaAfterHide = (e: Event) =>
  emit('wa-after-hide', e as WaAfterHideEvent);
const handleWaInvalid = (e: Event) => emit('wa-invalid', e as WaInvalidEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('input', handleInput);
  el.addEventListener('change', handleChange);
  el.addEventListener('focus', handleFocus);
  el.addEventListener('blur', handleBlur);
  el.addEventListener('wa-clear', handleWaClear);
  el.addEventListener('wa-show', handleWaShow);
  el.addEventListener('wa-after-show', handleWaAfterShow);
  el.addEventListener('wa-hide', handleWaHide);
  el.addEventListener('wa-after-hide', handleWaAfterHide);
  el.addEventListener('wa-invalid', handleWaInvalid);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('input', handleInput);
  el.removeEventListener('change', handleChange);
  el.removeEventListener('focus', handleFocus);
  el.removeEventListener('blur', handleBlur);
  el.removeEventListener('wa-clear', handleWaClear);
  el.removeEventListener('wa-show', handleWaShow);
  el.removeEventListener('wa-after-show', handleWaAfterShow);
  el.removeEventListener('wa-hide', handleWaHide);
  el.removeEventListener('wa-after-hide', handleWaAfterHide);
  el.removeEventListener('wa-invalid', handleWaInvalid);
});

defineExpose({
  focus: (options: FocusOptions) => elementRef.value?.focus?.(options),
  blur: () => elementRef.value?.blur?.(),
  show: () => elementRef.value?.show?.(),
  hide: () => elementRef.value?.hide?.(),
  formStateRestoreCallback: (state: string | File | FormData | null) =>
    elementRef.value?.formStateRestoreCallback?.(state),
  setCustomValidity: (message: string) =>
    elementRef.value?.setCustomValidity?.(message),
  resetValidity: () => elementRef.value?.resetValidity?.(),
  element: elementRef,
});
</script>

<template>
  <wa-time-input
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
  >
    <slot />
  </wa-time-input>
</template>
