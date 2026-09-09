<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
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
}

const props = defineProps<ColorPickerProps>();

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
  change: [event: Event];
  input: [event: InputEvent];
  'wa-show': [event: CustomEvent];
  'wa-after-show': [event: CustomEvent];
  'wa-hide': [event: CustomEvent];
  'wa-after-hide': [event: CustomEvent];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
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

const handleChange = (e: Event) => emit('change', e as Event);
const handleInput = (e: Event) => {
  model.value = (e.target as any).value;
  emit('input', e as InputEvent);
};
const handleWaShow = (e: Event) => emit('wa-show', e as CustomEvent);
const handleWaAfterShow = (e: Event) => emit('wa-after-show', e as CustomEvent);
const handleWaHide = (e: Event) => emit('wa-hide', e as CustomEvent);
const handleWaAfterHide = (e: Event) => emit('wa-after-hide', e as CustomEvent);
const handleBlur = (e: Event) => emit('blur', e as FocusEvent);
const handleFocus = (e: Event) => emit('focus', e as FocusEvent);
const handleWaInvalid = (e: Event) => emit('wa-invalid', e as CustomEvent);

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

onUnmounted(() => {
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
    alpha: any
  ) =>
    (elementRef.value as any)?.getHexString?.(
      hue,
      saturation,
      brightness,
      alpha
    ),
  focus: (options: FocusOptions) => (elementRef.value as any)?.focus?.(options),
  blur: () => (elementRef.value as any)?.blur?.(),
  getFormattedValue: (
    format: 'hex' | 'hexa' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hsv' | 'hsva'
  ) => (elementRef.value as any)?.getFormattedValue?.(format),
  reportValidity: () => (elementRef.value as any)?.reportValidity?.(),
  show: () => (elementRef.value as any)?.show?.(),
  hide: () => (elementRef.value as any)?.hide?.(),
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
  <wa-color-picker
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
    :value="model"
  >
    <slot />
  </wa-color-picker>
</template>
