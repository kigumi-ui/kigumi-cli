<script setup lang="ts">
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import './Popup.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/popup/popup.js'));
}

/**
 * Popup is a utility component for positioning elements relative to an anchor
 */
export interface PopupProps {
  active?: boolean;
  anchor?: string;
  placement?:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'right'
    | 'right-start'
    | 'right-end'
    | 'left'
    | 'left-start'
    | 'left-end';
  strategy?: 'absolute' | 'fixed';
  distance?: number;
  skidding?: number;
  arrow?: boolean;
  'arrow-placement'?: 'start' | 'end' | 'center' | 'anchor';
  'arrow-padding'?: number;
  flip?: boolean;
  'flip-fallback-placements'?: string;
  'flip-fallback-strategy'?: 'best-fit' | 'initial';
  'flip-padding'?: number;
  shift?: boolean;
  'shift-padding'?: number;
  'auto-size'?: 'horizontal' | 'vertical' | 'both';
  sync?: 'width' | 'height' | 'both';
  'auto-size-padding'?: number;
}

const props = defineProps<PopupProps>();

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
  'wa-reposition': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaReposition = (e: Event) =>
  emit('wa-reposition', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-reposition', handleWaReposition);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-reposition', handleWaReposition);
});

defineExpose({
  reposition: () => (elementRef.value as any)?.reposition?.(),
  element: elementRef,
});
</script>

<template>
  <wa-popup ref="elementRef" v-bind="hostAttributes()" :class="$attrs.class">
    <slot />
  </wa-popup>
</template>
