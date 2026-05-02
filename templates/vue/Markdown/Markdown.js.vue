<script setup>
import { ref, computed, onMounted } from 'vue';
import './Markdown.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/markdown/markdown.js'));
}

/**
 * Renders markdown content in plain HTML
 *
 * @remarks Re-render programmatically by updating the projected source content (slotted children). The previous `getMarked()` / `updateAll()` methods are marked private in WA 3.5.0+ and are no longer exposed; `renderMarkdown()` remains available.
 */
const props = defineProps({
  'tab-size': { type: Number, required: false, default: 4 },
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
  renderMarkdown: () => elementRef.value?.renderMarkdown?.(),
  element: elementRef,
});
</script>

<template>
  <wa-markdown ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-markdown>
</template>
