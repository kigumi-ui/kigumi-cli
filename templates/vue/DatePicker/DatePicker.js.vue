<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
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

// Strip undefined and false props before forwarding to the web component.
// Vue boolean-prop coercion materializes absent optional Boolean props as
// `false`, but Web Awesome elements read attribute presence as truthy, so
// we must not forward `false` to <wa-*> (would render pill="" / loading="").
const definedProps = computed(() => {
  const result = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined && value !== false) result[key] = value;
  }
  return result;
});

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

onUnmounted(() => {
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
  <wa-date-picker ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-date-picker>
</template>
