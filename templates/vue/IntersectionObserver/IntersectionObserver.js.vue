<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import './IntersectionObserver.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/intersection-observer/intersection-observer.js'));
}

/**
 * Observes changes in the intersection of a target element with an ancestor
 */
const props = defineProps({
  disabled: { type: Boolean, required: false, default: false },
  once: { type: Boolean, required: false, default: false },
  threshold: { type: String, required: false, default: '0' },
  'root-margin': { type: String, required: false, default: '0px' },
  'intersect-class': { type: String, required: false },
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

const emit = defineEmits(['wa-intersect']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaIntersect = (e) => emit('wa-intersect', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-intersect', handleWaIntersect);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-intersect', handleWaIntersect);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-intersection-observer
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
  >
    <slot />
  </wa-intersection-observer>
</template>
