<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import './RelativeTime.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/relative-time/relative-time.js'));
}

/**
 * Outputs a localized time phrase relative to the current date and time
 */
export interface RelativeTimeProps {
  date?: string;
  format?: 'long' | 'short' | 'narrow';
  numeric?: 'always' | 'auto';
  sync?: boolean;
  lang?: string;
}

const props = defineProps<RelativeTimeProps>();

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
  <wa-relative-time
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-relative-time>
</template>
