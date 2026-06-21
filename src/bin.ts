#!/usr/bin/env node

export {};

const major = parseInt(process.version.slice(1), 10);

if (major < 22) {
  console.error(
    `kigumi requires Node.js 22.12 or later (detected ${process.version}).` +
      '\nPlease upgrade: https://nodejs.org'
  );
  process.exit(1);
}

await import('./index.js');
