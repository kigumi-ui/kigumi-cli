<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import './AccordionItem.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/accordion-item/accordion-item.js'));
}

/**
 * Accordion items are the individual disclosure panels placed inside an accordion
 */
export interface AccordionItemProps {
  label?: string;
  expanded?: boolean;
  disabled?: boolean;
}

const props = defineProps<AccordionItemProps>();

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
  expand: () => (elementRef.value as any)?.expand?.(),
  collapse: () => (elementRef.value as any)?.collapse?.(),
  toggle: () => (elementRef.value as any)?.toggle?.(),
  focus: (options: FocusOptions) => (elementRef.value as any)?.focus?.(options),
  element: elementRef,
});
</script>

<template>
  <wa-accordion-item
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-accordion-item>
</template>
