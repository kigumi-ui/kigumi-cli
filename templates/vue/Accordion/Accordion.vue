<script setup lang="ts">
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import type WaAccordion from '@awesome.me/webawesome/dist/components/accordion/accordion.js';
import type { WaAccordionAfterCollapseEvent } from '@awesome.me/webawesome/dist/events/accordion-after-collapse.js';
import type { WaAccordionAfterExpandEvent } from '@awesome.me/webawesome/dist/events/accordion-after-expand.js';
import type { WaAccordionCollapseEvent } from '@awesome.me/webawesome/dist/events/accordion-collapse.js';
import type { WaAccordionExpandEvent } from '@awesome.me/webawesome/dist/events/accordion-expand.js';
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
  'wa-expand': [event: WaAccordionExpandEvent];
  'wa-after-expand': [event: WaAccordionAfterExpandEvent];
  'wa-collapse': [event: WaAccordionCollapseEvent];
  'wa-after-collapse': [event: WaAccordionAfterCollapseEvent];
}>();

const elementRef = ref<WaAccordion | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaExpand = (e: Event) =>
  emit('wa-expand', e as WaAccordionExpandEvent);
const handleWaAfterExpand = (e: Event) =>
  emit('wa-after-expand', e as WaAccordionAfterExpandEvent);
const handleWaCollapse = (e: Event) =>
  emit('wa-collapse', e as WaAccordionCollapseEvent);
const handleWaAfterCollapse = (e: Event) =>
  emit('wa-after-collapse', e as WaAccordionAfterCollapseEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-expand', handleWaExpand);
  el.addEventListener('wa-after-expand', handleWaAfterExpand);
  el.addEventListener('wa-collapse', handleWaCollapse);
  el.addEventListener('wa-after-collapse', handleWaAfterCollapse);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-expand', handleWaExpand);
  el.removeEventListener('wa-after-expand', handleWaAfterExpand);
  el.removeEventListener('wa-collapse', handleWaCollapse);
  el.removeEventListener('wa-after-collapse', handleWaAfterCollapse);
});

defineExpose({
  expandAll: () => elementRef.value?.expandAll?.(),
  collapseAll: () => elementRef.value?.collapseAll?.(),
  element: elementRef,
});
</script>

<template>
  <wa-accordion
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
  >
    <slot />
  </wa-accordion>
</template>
