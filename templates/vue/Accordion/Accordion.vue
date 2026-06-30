<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './Accordion.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/accordion/accordion.js'));
}

/**
 * Accordions group related disclosure panels and control how many can be open at once
 */
export interface AccordionProps {
  mode?: 'single' | 'single-collapsible' | 'multiple';
  'icon-placement'?: 'start' | 'end';
  'heading-level'?: string;
  appearance?: 'filled' | 'outlined' | 'filled-outlined' | 'plain';
}

const props = defineProps<AccordionProps>();

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
  'wa-expand': [event: CustomEvent];
  'wa-after-expand': [event: CustomEvent];
  'wa-collapse': [event: CustomEvent];
  'wa-after-collapse': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaExpand = (e: Event) => emit('wa-expand', e as CustomEvent);
const handleWaAfterExpand = (e: Event) =>
  emit('wa-after-expand', e as CustomEvent);
const handleWaCollapse = (e: Event) => emit('wa-collapse', e as CustomEvent);
const handleWaAfterCollapse = (e: Event) =>
  emit('wa-after-collapse', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-expand', handleWaExpand);
  el.addEventListener('wa-after-expand', handleWaAfterExpand);
  el.addEventListener('wa-collapse', handleWaCollapse);
  el.addEventListener('wa-after-collapse', handleWaAfterCollapse);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-expand', handleWaExpand);
  el.removeEventListener('wa-after-expand', handleWaAfterExpand);
  el.removeEventListener('wa-collapse', handleWaCollapse);
  el.removeEventListener('wa-after-collapse', handleWaAfterCollapse);
});

defineExpose({
  expandAll: () => (elementRef.value as any)?.expandAll?.(),
  collapseAll: () => (elementRef.value as any)?.collapseAll?.(),
  element: elementRef,
});
</script>

<template>
  <wa-accordion ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-accordion>
</template>
