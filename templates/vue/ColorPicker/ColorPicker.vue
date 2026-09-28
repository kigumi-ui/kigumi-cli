<script setup lang="ts">
import { ref, onMounted, useAttrs, onBeforeUnmount, watch } from 'vue';
import type WaColorPicker from '@awesome.me/webawesome/dist/components/color-picker/color-picker.js';
import type { WaAfterHideEvent } from '@awesome.me/webawesome/dist/events/after-hide.js';
import type { WaAfterShowEvent } from '@awesome.me/webawesome/dist/events/after-show.js';
import type { WaHideEvent } from '@awesome.me/webawesome/dist/events/hide.js';
import type { WaInvalidEvent } from '@awesome.me/webawesome/dist/events/invalid.js';
import type { WaShowEvent } from '@awesome.me/webawesome/dist/events/show.js';
import './ColorPicker.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/color-picker/color-picker.js'));
}

/**
 * Color pickers allow the user to select a color
 */
export interface ColorPickerProps {
  format?: 'hex' | 'rgb' | 'hsl' | 'hsv';
  opacity?: boolean;
  disabled?: boolean;
  required?: boolean;
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';
  label?: string;
  hint?: string;
  name?: string;
  open?: boolean;
  placement?:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'right'
    | 'right-start'
    | 'right-end'
    | 'left'
    | 'left-start'
    | 'left-end';
  swatches?: string;
  uppercase?: boolean;
  'without-format-toggle'?: boolean;
  inline?: boolean;
  'custom-error'?: string;
}

const props = defineProps<ColorPickerProps>();

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
  'wa-show': [event: WaShowEvent];
  'wa-after-show': [event: WaAfterShowEvent];
  'wa-hide': [event: WaHideEvent];
  'wa-after-hide': [event: WaAfterHideEvent];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
  'wa-invalid': [event: WaInvalidEvent];
}>();

const model = defineModel<string>();

const elementRef = ref<WaColorPicker | null>(null);

watch(model, (val) => {
  const el = elementRef.value as (HTMLElement & { value: unknown }) | null;
  if (el && el.value !== val) el.value = val ?? '';
});

onMounted(() => {
  ensureLoaded();
});

const handleChange = (e: Event) => emit('change', e);
const handleInput = (e: Event) => {
  model.value = (e.target as HTMLElement & { value: string }).value;
  emit('input', e as InputEvent);
};
const handleWaShow = (e: Event) => emit('wa-show', e as WaShowEvent);
const handleWaAfterShow = (e: Event) =>
  emit('wa-after-show', e as WaAfterShowEvent);
const handleWaHide = (e: Event) => emit('wa-hide', e as WaHideEvent);
const handleWaAfterHide = (e: Event) =>
  emit('wa-after-hide', e as WaAfterHideEvent);
const handleBlur = (e: Event) => emit('blur', e as FocusEvent);
const handleFocus = (e: Event) => emit('focus', e as FocusEvent);
const handleWaInvalid = (e: Event) => emit('wa-invalid', e as WaInvalidEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('change', handleChange);
  el.addEventListener('input', handleInput);
  el.addEventListener('wa-show', handleWaShow);
  el.addEventListener('wa-after-show', handleWaAfterShow);
  el.addEventListener('wa-hide', handleWaHide);
  el.addEventListener('wa-after-hide', handleWaAfterHide);
  el.addEventListener('blur', handleBlur);
  el.addEventListener('focus', handleFocus);
  el.addEventListener('wa-invalid', handleWaInvalid);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('change', handleChange);
  el.removeEventListener('input', handleInput);
  el.removeEventListener('wa-show', handleWaShow);
  el.removeEventListener('wa-after-show', handleWaAfterShow);
  el.removeEventListener('wa-hide', handleWaHide);
  el.removeEventListener('wa-after-hide', handleWaAfterHide);
  el.removeEventListener('blur', handleBlur);
  el.removeEventListener('focus', handleFocus);
  el.removeEventListener('wa-invalid', handleWaInvalid);
});

defineExpose({
  getHexString: (
    hue: number,
    saturation: number,
    brightness: number,
    alpha?: number
  ) => elementRef.value?.getHexString?.(hue, saturation, brightness, alpha),
  focus: (options?: FocusOptions) => elementRef.value?.focus?.(options),
  blur: () => elementRef.value?.blur?.(),
  getFormattedValue: (
    format?: 'hex' | 'hexa' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hsv' | 'hsva'
  ) => elementRef.value?.getFormattedValue?.(format),
  reportValidity: () => elementRef.value?.reportValidity?.(),
  show: () => elementRef.value?.show?.(),
  hide: () => elementRef.value?.hide?.(),
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
  <wa-color-picker
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
    :value="model"
  >
    <slot />
  </wa-color-picker>
</template>
