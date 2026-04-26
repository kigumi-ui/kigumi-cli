<script setup>
import { ref, computed, onMounted } from 'vue';
import './FormatDate.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/format-date/format-date.js'));
}

/**
 * Formats a date/time using the Intl.DateTimeFormat API
 */
const props = defineProps({
    date: { type: String, required: false },
    weekday: { type: String, required: false },
    era: { type: String, required: false },
    year: { type: String, required: false },
    month: { type: String, required: false },
    day: { type: String, required: false },
    hour: { type: String, required: false },
    minute: { type: String, required: false },
    second: { type: String, required: false },
    'hour-format': { type: String, required: false, default: 'auto' },
    'time-zone-name': { type: String, required: false },
    'time-zone': { type: String, required: false },
    lang: { type: String, required: false }
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

const emit = defineEmits([]);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-format-date
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-format-date>
</template>
