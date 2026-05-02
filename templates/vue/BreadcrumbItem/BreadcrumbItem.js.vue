<script setup>
import { ref, computed, onMounted } from 'vue';
import './BreadcrumbItem.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/breadcrumb-item/breadcrumb-item.js'));
}

/**
 * Breadcrumb Items are used inside breadcrumbs to represent different links
 */
const props = defineProps({
  href: { type: String, required: false },
  target: { type: String, required: false },
  rel: { type: String, required: false, default: 'noreferrer noopener' },
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
