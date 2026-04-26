<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import './FormatDate.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/format-date/format-date.js'));
}

/**
 * Formats a date/time using the Intl.DateTimeFormat API
 */
export interface FormatDateProps {
  date?: string;
  weekday?: 'narrow' | 'short' | 'long';
  era?: 'narrow' | 'short' | 'long';
  year?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'narrow' | 'short' | 'long';
  day?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
  'hour-format'?: 'auto' | '12' | '24';
  'time-zone-name'?: 'short' | 'long';
  'time-zone'?: string;
  lang?: string;
}

const props = defineProps<FormatDateProps>();

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
  // No events for this component
}>();

const elementRef = ref<HTMLElement | null>(null);

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
