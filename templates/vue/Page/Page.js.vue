<script setup>
import { ref, onMounted, useAttrs } from 'vue';
import './Page.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/page/page.js'));
}

/**
 * Pages offer an easy way to scaffold entire page layouts using minimal markup
 */
const props = defineProps({
  'disable-navigation-toggle': {
    type: Boolean,
    required: false,
    default: false,
  },
  'mobile-breakpoint': { type: String, required: false, default: '768px' },
  'navigation-placement': { type: String, required: false, default: 'start' },
  'nav-open': { type: Boolean, required: false, default: false },
  view: { type: String, required: false, default: 'desktop' },
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

const emit = defineEmits([]);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

defineExpose({
  visiblePixelsInViewport: (element) =>
    elementRef.value?.visiblePixelsInViewport?.(element),
  showNavigation: () => elementRef.value?.showNavigation?.(),
  hideNavigation: () => elementRef.value?.hideNavigation?.(),
  toggleNavigation: () => elementRef.value?.toggleNavigation?.(),
  element: elementRef,
});
</script>

<template>
  <wa-page ref="elementRef" v-bind="hostAttributes()" :class="$attrs.class">
    <slot />
  </wa-page>
</template>
