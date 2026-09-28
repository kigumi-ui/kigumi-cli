<script setup lang="ts">
import { ref, onMounted, useAttrs, onBeforeUnmount, watch } from 'vue';
import type WaDetails from '@awesome.me/webawesome/dist/components/details/details.js';
import type { WaAfterHideEvent } from '@awesome.me/webawesome/dist/events/after-hide.js';
import type { WaAfterShowEvent } from '@awesome.me/webawesome/dist/events/after-show.js';
import type { WaHideEvent } from '@awesome.me/webawesome/dist/events/hide.js';
import type { WaShowEvent } from '@awesome.me/webawesome/dist/events/show.js';
import './Details.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/details/details.js'));
}

/**
 * Shows a brief summary and expands to show additional content
 */
export interface DetailsProps {
  summary?: string;
  disabled?: boolean;
  appearance?: 'filled' | 'outlined' | 'filled-outlined' | 'plain';
  'icon-placement'?: 'start' | 'end';
  name?: string;
}

const props = defineProps<DetailsProps>();

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
  'wa-show': [event: WaShowEvent];
  'wa-after-show': [event: WaAfterShowEvent];
  'wa-hide': [event: WaHideEvent];
  'wa-after-hide': [event: WaAfterHideEvent];
}>();

const open = defineModel<boolean>('open', { default: false });

const elementRef = ref<WaDetails | null>(null);

watch(open, (newOpen) => {
  const el = elementRef.value as (HTMLElement & { open: boolean }) | null;
  if (el && el.open !== newOpen) el.open = newOpen;
});

onMounted(() => {
  ensureLoaded();
});

const handleWaShow = (e: Event) => {
  open.value = true;
  emit('wa-show', e as WaShowEvent);
};
const handleWaAfterShow = (e: Event) =>
  emit('wa-after-show', e as WaAfterShowEvent);
const handleWaHide = (e: Event) => {
  open.value = false;
  emit('wa-hide', e as WaHideEvent);
};
const handleWaAfterHide = (e: Event) =>
  emit('wa-after-hide', e as WaAfterHideEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-show', handleWaShow);
  el.addEventListener('wa-after-show', handleWaAfterShow);
  el.addEventListener('wa-hide', handleWaHide);
  el.addEventListener('wa-after-hide', handleWaAfterHide);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-show', handleWaShow);
  el.removeEventListener('wa-after-show', handleWaAfterShow);
  el.removeEventListener('wa-hide', handleWaHide);
  el.removeEventListener('wa-after-hide', handleWaAfterHide);
});

defineExpose({
  show: () => elementRef.value?.show?.(),
  hide: () => elementRef.value?.hide?.(),
  element: elementRef,
});
</script>

<template>
  <wa-details
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
    :open="open || undefined"
  >
    <slot />
  </wa-details>
</template>
