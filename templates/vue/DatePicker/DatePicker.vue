<script setup lang="ts">
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
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
  'wa-focus-day': [event: CustomEvent];
  'wa-view-change': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleInput = (e: Event) => emit('input', e as InputEvent);
const handleChange = (e: Event) => emit('change', e as Event);
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

onBeforeUnmount(() => {
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
  <wa-date-picker
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
  >
    <slot />
  </wa-date-picker>
</template>
