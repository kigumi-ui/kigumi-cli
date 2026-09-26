<script setup lang="ts">
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import './MutationObserver.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/mutation-observer/mutation-observer.js'));
}

/**
 * Observes changes to a target element and emits events when they occur
 */
export interface MutationObserverProps {
  attr?: string;
  'attr-old-value'?: boolean;
  'char-data'?: boolean;
  'char-data-old-value'?: boolean;
  'child-list'?: boolean;
  disabled?: boolean;
  subtree?: boolean;
}

const props = defineProps<MutationObserverProps>();

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
  'wa-mutation': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaMutation = (e: Event) => emit('wa-mutation', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-mutation', handleWaMutation);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-mutation', handleWaMutation);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-mutation-observer
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
  >
    <slot />
  </wa-mutation-observer>
</template>
