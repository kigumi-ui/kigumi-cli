<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './DatePicker.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/date-picker/date-picker.js'));
}

/**
 * An inline calendar for selecting a single date or a date range
 */
export interface DatePickerProps {
  mode?: 'single' | 'range';
  value?: string;
  min?: string;
  max?: string;
  today?: string;
  'focused-date'?: string;
  view?: 'months' | 'days' | 'years';
  months?: '1' | '2';
  'page-by'?: 'single' | 'months';
  'first-day-of-week'?:
    'auto' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
  'with-outside-days'?: boolean;
  'with-week-numbers'?: boolean;
  'weekday-format'?: 'narrow' | 'short' | 'long';
  disabled?: boolean;
  readonly?: boolean;
  'disabled-dates'?: string;
  'disabled-days-of-week'?: string;
  'disable-past'?: boolean;
  'disable-future'?: boolean;
  'min-range'?: number;
  'max-range'?: number;
  size?: 'xs' | 's' | 'm' | 'l' | 'xl';
  locale?: string;
}

const props = defineProps<DatePickerProps>();

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
  'wa-focus-day': [event: CustomEvent];
  'wa-view-change': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleInput = (e: Event) => emit('input', e as CustomEvent);
const handleChange = (e: Event) => emit('change', e as CustomEvent);
const handleWaFocusDay = (e: Event) => emit('wa-focus-day', e as CustomEvent);
const handleWaViewChange = (e: Event) =>
  emit('wa-view-change', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('input', handleInput);
  el.addEventListener('change', handleChange);
  el.addEventListener('wa-focus-day', handleWaFocusDay);
  el.addEventListener('wa-view-change', handleWaViewChange);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('input', handleInput);
  el.removeEventListener('change', handleChange);
  el.removeEventListener('wa-focus-day', handleWaFocusDay);
  el.removeEventListener('wa-view-change', handleWaViewChange);
});

defineExpose({
  focus: (options: FocusOptions) => (elementRef.value as any)?.focus?.(options),
  goToDate: (date: string | Date) =>
    (elementRef.value as any)?.goToDate?.(date),
  goToToday: () => (elementRef.value as any)?.goToToday?.(),
  clear: () => (elementRef.value as any)?.clear?.(),
  element: elementRef,
});
</script>

<template>
  <wa-date-picker ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-date-picker>
</template>
