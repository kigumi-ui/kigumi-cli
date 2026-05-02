<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import './Page.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/page/page.js'));
}

/**
 * Pages offer an easy way to scaffold entire page layouts using minimal markup
 */
export interface PageProps {
  'disable-navigation-toggle'?: boolean;
  'mobile-breakpoint'?: string;
  'navigation-placement'?: 'start' | 'end';
  'nav-open'?: boolean;
  view?: 'mobile' | 'desktop';
}

const props = defineProps<PageProps>();

// Strip undefined and false props before forwarding to the web component.
// Vue boolean-prop coercion materializes absent optional Boolean props as
// `false`, but Web Awesome elements read attribute presence as truthy, so
// we must not forward `false` to <wa-*> (would render pill="" / loading="").
const definedProps = computed(() => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
    if (value !== undefined && value !== false) result[key] = value;
  }
  return result;
});

const emit = defineEmits<{
  // No events for this component
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

defineExpose({
  visiblePixelsInViewport: (element: HTMLElement | null) =>
    (elementRef.value as any)?.visiblePixelsInViewport?.(element),
  showNavigation: () => (elementRef.value as any)?.showNavigation?.(),
  hideNavigation: () => (elementRef.value as any)?.hideNavigation?.(),
  toggleNavigation: () => (elementRef.value as any)?.toggleNavigation?.(),
  element: elementRef,
});
</script>

<template>
  <wa-page ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-page>
</template>
