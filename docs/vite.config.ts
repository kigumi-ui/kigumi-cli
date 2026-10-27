import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'fs';
import { localApiMiddleware, type RouteModule } from './api/_lib/local-api';
import { THEME_AGENT_ENDPOINT } from './src/kigumi-studio/theme-agent/constants';

// Read version from root package.json
const rootPackageJson = JSON.parse(
  readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')
);

// `pnpm dev:agent` (../scripts/dev-theme-agent.mjs) sets THEME_AGENT_LOCAL
// after checking the keys, and the dev server then runs the Theme Agent's
// Vercel Function itself. Plain `pnpm dev` and every build leave it out.
function themeAgentLocalApi(): Plugin {
  return {
    name: 'kigumi-theme-agent-local-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(
        localApiMiddleware(
          THEME_AGENT_ENDPOINT,
          () =>
            server.ssrLoadModule('/api/theme-agent.ts') as Promise<RouteModule>
        )
      );
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    ...(process.env.THEME_AGENT_LOCAL === '1' ? [themeAgentLocalApi()] : []),
  ],
  define: {
    __CLI_VERSION__: JSON.stringify(rootPackageJson.version),
  },
});
