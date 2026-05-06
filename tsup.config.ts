import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts', bin: 'src/bin.ts' },
  format: ['esm'],
  sourcemap: true,
  clean: true,
  dts: { entry: { index: 'src/index.ts' } },
});
