import vue from '@vitejs/plugin-vue';

/**
 * Shared Vite plugin entry that compiles Vue SFCs, so the Vue function
 * harness (`tests/unit/vue-function-harness-registry.test.ts`, issue #76) can
 * import committed `.vue` Templates.
 *
 * `isCustomElement` mirrors what `kigumi init` writes into a Vue consumer's
 * `vite.config` (`src/utils/project-config.ts`): `wa-*` tags compile as native
 * elements rather than unresolved components. Proving the Templates under any
 * other compiler setting would prove a build no user runs. Used by both
 * `vitest.config.ts` and `vitest.unit.config.ts`, so the two cannot drift.
 */
export const VUE_SFC_PLUGIN = vue({
  template: {
    compilerOptions: {
      isCustomElement: (tag: string) => tag.startsWith('wa-'),
    },
  },
});
