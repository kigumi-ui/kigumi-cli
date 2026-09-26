<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import './DatePicker.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/date-picker/date-picker.js'));
}

/**
 * An inline calendar for selecting a single date or a date range
 */
const props = defineProps({
  mode: { type: String, required: false, default: 'single' },
  value: { type: String, required: false },
  min: { type: String, required: false },
  max: { type: String, required: false },
  today: { type: String, required: false },
  'focused-date': { type: String, required: false },
  view: { type: String, required: false, default: 'days' },
  months: { type: Number, required: false, default: 1 },
  'page-by': { type: String, required: false, default: 'months' },
  'first-day-of-week': { type: String, required: false, default: 'auto' },
  'with-outside-days': { type: Boolean, required: false, default: false },
  'with-week-numbers': { type: Boolean, required: false, default: false },
  'weekday-format': { type: String, required: false, default: 'short' },
  disabled: { type: Boolean, required: false, default: false },
  readonly: { type: Boolean, required: false, default: false },
  'disabled-dates': { type: String, required: false },
  'disabled-days-of-week': { type: String, required: false },
  'disable-past': { type: Boolean, required: false, default: false },
  'disable-future': { type: Boolean, required: false, default: false },
  'min-range': { type: Number, required: false, default: 0 },
  'max-range': { type: Number, required: false, default: 0 },
  size: { type: String, required: false, default: 'm' },
  locale: { type: String, required: false },
});

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

function hostAttributes() {
  const result = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') continue;
    if (value === false && !/^(aria|data)-/.test(key)) continue;
    result[key] = value;
  }
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === false) continue;
    result[key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)] = value;
  }
  return result;
}

const emit = defineEmits(['input', 'change', 'wa-focus-day', 'wa-view-change']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleInput = (e) => emit('input', e);
const handleChange = (e) => emit('change', e);
const handleWaFocusDay = (e) => emit('wa-focus-day', e);
const handleWaViewChange = (e) => emit('wa-view-change', e);

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
  focus: (options) => elementRef.value?.focus?.(options),
  goToDate: (date) => elementRef.value?.goToDate?.(date),
  goToToday: () => elementRef.value?.goToToday?.(),
  clear: () => elementRef.value?.clear?.(),
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
