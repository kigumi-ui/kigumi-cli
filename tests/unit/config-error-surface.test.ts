/**
 * Config Error Surface Tests
 *
 * Each command that uses the pre-flight pattern (try { getConfig() } catch
 * { if (!(err instanceof ConfigNotFoundError)) throw err; }) gets a single
 * test here to prove ConfigInvalidError actually surfaces — not the cryptic
 * "Configuration not loaded despite passing checks" fallback.
 *
 * One test per command rather than per branch keeps the surface area
 * manageable while still exercising both halves of the new try/catch.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { createRecordingOutput } from './_helpers/output.js';
import { createTestPrompts } from './_helpers/prompts.js';
import { writeTierFixture } from './_helpers/tier.js';

const typoConfig = {
  framework: 'react',
  typescript: true,
  componentsDir: 'src/components/ui',
  utilsDir: 'src/lib',
  stylesDir: 'src/styles',
  theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
  framwork: 'vue',
};

async function setupProject(testDir: string): Promise<void> {
  await fs.ensureDir(path.join(testDir, 'src/components/ui'));
  await fs.ensureDir(path.join(testDir, 'src/lib'));
  await fs.ensureDir(path.join(testDir, 'src/styles'));
  await fs.writeJSON(path.join(testDir, 'package.json'), {
    name: 'test',
    dependencies: { '@awesome.me/webawesome': '^3.4.0' },
  });
  await fs.writeFile(
    path.join(testDir, 'src/lib/kigumi.ts'),
    "import '../styles/layers.css';\n"
  );
  await fs.writeFile(
    path.join(testDir, 'src/styles/layers.css'),
    '@layer base, theme;\n'
  );
}

function combinedOutput(
  recording: ReturnType<typeof createRecordingOutput>
): string {
  return recording.calls
    .map((c) => c.args.map((a) => String(a ?? '')).join(' '))
    .join('\n');
}

describe('config error surface', () => {
  let testDir: string;
  let originalExit: typeof process.exit;

  beforeEach(async () => {
    vi.resetModules();
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-cfg-err-'));
    await writeTierFixture(testDir, 'free');
    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;
  });

  afterEach(async () => {
    process.exit = originalExit;
    await fs.remove(testDir);
    const outMod = await import('../../src/output/index.js');
    outMod.resetOutputForTesting();
    const promptsMod = await import('../../src/prompts/index.js');
    promptsMod.resetPromptsForTesting();
    vi.restoreAllMocks();
  });

  async function setupSeams(): Promise<
    ReturnType<typeof createRecordingOutput>
  > {
    const recording = createRecordingOutput();
    const outMod = await import('../../src/output/index.js');
    outMod.setOutputForTesting(recording);
    const promptsMod = await import('../../src/prompts/index.js');
    promptsMod.setPromptsForTesting(createTestPrompts({}));
    return recording;
  }

  async function runWithTypoConfig(
    action: () => Promise<void>
  ): Promise<string> {
    const recording = await setupSeams();
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), typoConfig);
    await setupProject(testDir);
    const originalCwd = process.cwd();
    process.chdir(testDir);
    try {
      await action();
    } finally {
      process.chdir(originalCwd);
    }
    return combinedOutput(recording);
  }

  it('palette command surfaces ConfigInvalidError on typo config', async () => {
    const text = await runWithTypoConfig(async () => {
      const { paletteCommand } = await import('../../src/commands/palette.js');
      await paletteCommand.parseAsync(['node', 'palette', 'bright']);
    });
    expect(text).not.toContain(
      'Configuration not loaded despite passing checks'
    );
  });

  it('brand command surfaces ConfigInvalidError on typo config', async () => {
    const text = await runWithTypoConfig(async () => {
      const { brandCommand } = await import('../../src/commands/brand.js');
      await brandCommand.parseAsync(['node', 'brand', 'red']);
    });
    expect(text).not.toContain(
      'Configuration not loaded despite passing checks'
    );
  });

  it('theme command surfaces ConfigInvalidError on typo config', async () => {
    const text = await runWithTypoConfig(async () => {
      const { themeCommand } = await import('../../src/commands/theme.js');
      await themeCommand.parseAsync(['node', 'theme', 'awesome']);
    });
    expect(text).not.toContain(
      'Configuration not loaded despite passing checks'
    );
  });

  it('registry list-sources action surfaces ConfigInvalidError on typo config', async () => {
    const text = await runWithTypoConfig(async () => {
      const { registryListSourcesAction } =
        await import('../../src/commands/registry/list-sources.js');
      await registryListSourcesAction({ cwd: testDir });
    });
    expect(text).not.toContain(
      'Configuration not loaded despite passing checks'
    );
  });
});
