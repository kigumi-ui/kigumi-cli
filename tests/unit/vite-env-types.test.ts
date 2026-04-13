import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { updateViteEnvTypes } from '../../src/utils/vite-env.js';
import type { OutputInterface } from '../../src/output/types.js';

/**
 * Minimal vite-env.d.ts fixture with the auto-managed comment
 * and IntrinsicElements interface that updateViteEnvTypes expects.
 */
const MANAGED_VITE_ENV = `/// <reference types="vite/client" />
// auto-managed by kigumi - do not edit manually

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'wa-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export {};
`;

/** vite-env.d.ts without the auto-managed marker */
const USER_MANAGED_VITE_ENV = `/// <reference types="vite/client" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'wa-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export {};
`;

function createMockOutput(): OutputInterface {
  return {
    intro: vi.fn(),
    outro: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
    step: vi.fn(),
    spinner: vi.fn().mockReturnValue({
      start: vi.fn(),
      stop: vi.fn(),
      error: vi.fn(),
    }),
    note: vi.fn(),
    table: vi.fn(),
    log: vi.fn(),
  } as unknown as OutputInterface;
}

describe('updateViteEnvTypes', () => {
  let tmpDir: string;
  let output: OutputInterface;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-vite-env-'));
    await fs.ensureDir(path.join(tmpDir, 'src'));
    output = createMockOutput();
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it('adds a single-word component tag name correctly', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'src/vite-env.d.ts'),
      MANAGED_VITE_ENV
    );

    await updateViteEnvTypes(tmpDir, ['Badge'], output);

    const content = await fs.readFile(
      path.join(tmpDir, 'src/vite-env.d.ts'),
      'utf-8'
    );
    expect(content).toContain("'wa-badge':");
  });

  it('adds a multi-word component with correct kebab-case tag name', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'src/vite-env.d.ts'),
      MANAGED_VITE_ENV
    );

    await updateViteEnvTypes(tmpDir, ['ButtonGroup'], output);

    const content = await fs.readFile(
      path.join(tmpDir, 'src/vite-env.d.ts'),
      'utf-8'
    );
    expect(content).toContain("'wa-button-group':");
  });

  it('does NOT produce wrong un-hyphenated tag name for multi-word components', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'src/vite-env.d.ts'),
      MANAGED_VITE_ENV
    );

    await updateViteEnvTypes(tmpDir, ['ButtonGroup'], output);

    const content = await fs.readFile(
      path.join(tmpDir, 'src/vite-env.d.ts'),
      'utf-8'
    );
    expect(content).not.toContain("'wa-buttongroup':");
  });

  it('handles multiple multi-word components correctly', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'src/vite-env.d.ts'),
      MANAGED_VITE_ENV
    );

    await updateViteEnvTypes(
      tmpDir,
      ['SplitPanel', 'TabGroup', 'TreeItem'],
      output
    );

    const content = await fs.readFile(
      path.join(tmpDir, 'src/vite-env.d.ts'),
      'utf-8'
    );
    expect(content).toContain("'wa-split-panel':");
    expect(content).toContain("'wa-tab-group':");
    expect(content).toContain("'wa-tree-item':");
    // None of the wrong forms
    expect(content).not.toContain("'wa-splitpanel':");
    expect(content).not.toContain("'wa-tabgroup':");
    expect(content).not.toContain("'wa-treeitem':");
  });

  it('is idempotent - does not duplicate existing entries', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'src/vite-env.d.ts'),
      MANAGED_VITE_ENV
    );

    await updateViteEnvTypes(tmpDir, ['ButtonGroup'], output);
    await updateViteEnvTypes(tmpDir, ['ButtonGroup'], output);

    const content = await fs.readFile(
      path.join(tmpDir, 'src/vite-env.d.ts'),
      'utf-8'
    );
    const matches = content.match(/'wa-button-group':/g);
    expect(matches).toHaveLength(1);
  });

  it('does not modify file without auto-managed comment', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'src/vite-env.d.ts'),
      USER_MANAGED_VITE_ENV
    );

    await updateViteEnvTypes(tmpDir, ['ButtonGroup'], output);

    const content = await fs.readFile(
      path.join(tmpDir, 'src/vite-env.d.ts'),
      'utf-8'
    );
    expect(content).toBe(USER_MANAGED_VITE_ENV);
    expect(content).not.toContain("'wa-button-group':");
  });

  it('does not throw when vite-env.d.ts does not exist', async () => {
    await expect(
      updateViteEnvTypes(tmpDir, ['ButtonGroup'], output)
    ).resolves.toBeUndefined();
  });
});
