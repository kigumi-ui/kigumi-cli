<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import './BreadcrumbItem.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/breadcrumb-item/breadcrumb-item.js'));
}

/**
 * Breadcrumb Items are used inside breadcrumbs to represent different links
 */
export interface BreadcrumbItemProps {
  href?: string;
  target?: '_blank' | '_parent' | '_self' | '_top';
  rel?: string;
}

const props = defineProps<BreadcrumbItemProps>();

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
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
  element: elementRef,
});
</script>

<template>
  <wa-breadcrumb-item
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-breadcrumb-item>
</template>
