<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import './RandomContent.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/random-content/random-content.js'));
}

/**
 * Randomly selects and displays one or more of its child elements
 */
const props = defineProps({
  items: { type: Number, required: false, default: 1 },
  mode: { type: String, required: false, default: 'unique' },
  autoplay: { type: Boolean, required: false, default: false },
  'autoplay-interval': { type: Number, required: false, default: 3000 },
  animation: { type: String, required: false, default: 'none' },
});

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

function hostAttributes() {
  const result = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') continue;
    if (value === false && !/^(aria|data)-/.test(key)) continue;
    result[key] = value;
  }
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === false) continue;
    result[key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)] = value;
  }
  return result;
}

const emit = defineEmits(['wa-content-change']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaContentChange = (e) => emit('wa-content-change', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-content-change', handleWaContentChange);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-content-change', handleWaContentChange);
});

defineExpose({
  randomize: () => elementRef.value?.randomize?.(),
  element: elementRef,
});
</script>

<template>
  <wa-random-content
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
  >
    <slot />
  </wa-random-content>
</template>
