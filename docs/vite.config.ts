import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'fs';

// Read version from root package.json
const rootPackageJson = JSON.parse(
  readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')
);

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [react()],
  define: {
    __CLI_VERSION__: JSON.stringify(rootPackageJson.version),
  },
});
