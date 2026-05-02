<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import './FormatNumber.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/format-number/format-number.js'));
}

/**
 * Formats a number using the Intl.NumberFormat API
 */
export interface FormatNumberProps {
  value?: number;
  type?: 'currency' | 'decimal' | 'percent';
  currency?: string;
  'currency-display'?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
  'minimum-integer-digits'?: number;
  'minimum-fraction-digits'?: number;
  'maximum-fraction-digits'?: number;
  'minimum-significant-digits'?: number;
  'maximum-significant-digits'?: number;
  'without-grouping'?: boolean;
  lang?: string;
}

const props = defineProps<FormatNumberProps>();

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
  <wa-format-number
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-format-number>
</template>
