import { defineConfig } from '@trigger.dev/sdk';

// trigger.dev project for the Kigumi Studio Theme Agent. Deployed by hand
// from docs/ (see src/kigumi-studio/AGENTS.md, "Theme Agent").
export default defineConfig({
  project: 'proj_qhncjounjielvzhzbesz',
  runtime: 'node-22',
  logLevel: 'log',
  // Fallback ceiling in compute seconds; each task sets its own.
  maxDuration: 300,
  // A retried LLM turn is paid twice. Fail once, and let the user resend.
  retries: {
    enabledInDev: false,
    default: { maxAttempts: 1 },
  },
  dirs: ['./trigger'],
});
