<script setup lang="ts">
import { ref, onMounted, useAttrs } from 'vue';
import './Markdown.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/markdown/markdown.js'));
}

/**
 * Renders markdown content in plain HTML
 *
 * @remarks Re-render programmatically by updating the projected source content (slotted children). The previous `getMarked()` / `updateAll()` methods are marked private in WA 3.5.0+ and are no longer exposed; `renderMarkdown()` remains available.
 */
export interface MarkdownProps {
  'tab-size'?: number;
}

const props = defineProps<MarkdownProps>();

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
  // No events for this component
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

defineExpose({
  renderMarkdown: () => (elementRef.value as any)?.renderMarkdown?.(),
  element: elementRef,
});
</script>

<template>
  <wa-markdown ref="elementRef" v-bind="hostAttributes()" :class="$attrs.class">
    <slot />
  </wa-markdown>
</template>
