<script setup>
import { ref, computed, onMounted } from 'vue';
import './AccordionItem.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/accordion-item/accordion-item.js'));
}

/**
 * Accordion items are the individual disclosure panels placed inside an accordion
 */
const props = defineProps({
  label: { type: String, required: false, default: '' },
  expanded: { type: Boolean, required: false, default: false },
  disabled: { type: Boolean, required: false, default: false },
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
  expand: () => elementRef.value?.expand?.(),
  collapse: () => elementRef.value?.collapse?.(),
  toggle: () => elementRef.value?.toggle?.(),
  focus: (options) => elementRef.value?.focus?.(options),
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
