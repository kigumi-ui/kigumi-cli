/**
 * handleTierMigration Tests
 *
 * Unit-tests the Free <-> Pro tier migration orchestrator in
 * src/commands/init/index.ts. Mocks the migration helpers so we can verify
 * dispatch without touching the filesystem migration paths (those have their
 * own coverage in tests/integration/init.test.ts).
 *
 * Confirmation paths exercise p.confirm via vi.spyOn on the prompts wrapper;
 * non-interactive paths skip it entirely.
 *
 * Cluster S, F-126: rewritten to use vi.spyOn on the prompts wrapper
 * module instead of a module-level mock for @clack/prompts. The migration
 * mock stays since src/commands/init/migration.js has no DI seam.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as p from '../../src/prompts/index.js';
import {
  handleTierMigration,
  confirmInstallation,
} from '../../src/commands/init/index.js';
import {
  migratePackageReferences,
  reverseMigratePackageReferences,
} from '../../src/commands/init/migration.js';
import { createTestOutput } from './_helpers/output.js';
import { createTestKigumiConfig } from './_helpers/kigumi-config.js';
import type { OutputInterface } from '../../src/output/types.js';
import type { KigumiConfig } from '../../src/schemas/index.js';
import type { Tier } from '../../src/utils/tier.js';

vi.mock('../../src/commands/init/migration.js', () => ({
  migratePackageReferences: vi.fn(async () => undefined),
  reverseMigratePackageReferences: vi.fn(async () => undefined),
}));

type Ctx = Parameters<typeof handleTierMigration>[0];
type CfgResult = Parameters<typeof handleTierMigration>[1];

interface ContextOverrides {
  output: OutputInterface;
  cwd: string;
  isNonInteractive: boolean;
  existingConfig: KigumiConfig | null;
  previousTier: Tier;
  initialTier?: Tier;
}

function makeContext(opts: ContextOverrides): Ctx {
  // Only the fields handleTierMigration reads are meaningful; everything else
  // is filler to satisfy the InitContext shape.
  const projectInfo = {
    framework: 'react',
    typescript: true,
    packageManager: 'npm',
    hasVite: true,
    isNext: false,
    sourceLayout: 'src',
  } as Ctx['projectInfo'];

  return {
    cwd: opts.cwd,
    output: opts.output,
    isNonInteractive: opts.isNonInteractive,
    existingConfig: opts.existingConfig,
    existingAction: opts.existingConfig ? 'update' : null,
    projectInfo,
    previousTier: opts.previousTier,
    initialTier: opts.initialTier ?? opts.previousTier,
  } as Ctx;
}

function makeConfigResult(newTier: Tier): CfgResult {
  return {
    config: createTestKigumiConfig(),
    proToken: newTier === 'pro' ? 'token-xyz' : undefined,
    newTier,
  } as CfgResult;
}

describe('handleTierMigration', () => {
  let output: OutputInterface;
  let confirmSpy: ReturnType<typeof vi.spyOn>;
  let isCancelSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    confirmSpy = vi.spyOn(p, 'confirm');
    // Reset isCancel to its happy-path default so a previous "cancel"
    // case doesn't bleed into the next test.
    isCancelSpy = vi.spyOn(p, 'isCancel').mockReturnValue(false);
    output = createTestOutput();
  });

  afterEach(() => {
    confirmSpy.mockRestore();
    isCancelSpy.mockRestore();
  });

  it('returns didMigrate=false when there is no existing config', async () => {
    const ctx = makeContext({
      output,
      cwd: '/tmp/k',
      isNonInteractive: true,
      existingConfig: null,
      previousTier: 'free',
    });

    const result = await handleTierMigration(ctx, makeConfigResult('pro'));

    expect(result.didMigrate).toBe(false);
    expect(vi.mocked(migratePackageReferences)).not.toHaveBeenCalled();
    expect(vi.mocked(reverseMigratePackageReferences)).not.toHaveBeenCalled();
  });

  it('returns didMigrate=false when the tier did not change (free -> free)', async () => {
    const cfg = createTestKigumiConfig();
    const ctx = makeContext({
      output,
      cwd: '/tmp/k',
      isNonInteractive: true,
      existingConfig: cfg,
      previousTier: 'free',
    });

    const result = await handleTierMigration(ctx, makeConfigResult('free'));

    expect(result.didMigrate).toBe(false);
    expect(vi.mocked(migratePackageReferences)).not.toHaveBeenCalled();
    expect(vi.mocked(reverseMigratePackageReferences)).not.toHaveBeenCalled();
  });

  it('returns didMigrate=false when the tier did not change (pro -> pro)', async () => {
    const cfg = createTestKigumiConfig();
    const ctx = makeContext({
      output,
      cwd: '/tmp/k',
      isNonInteractive: true,
      existingConfig: cfg,
      previousTier: 'pro',
    });

    const result = await handleTierMigration(ctx, makeConfigResult('pro'));

    expect(result.didMigrate).toBe(false);
    expect(vi.mocked(migratePackageReferences)).not.toHaveBeenCalled();
    expect(vi.mocked(reverseMigratePackageReferences)).not.toHaveBeenCalled();
  });

  describe('Free -> Pro upgrade', () => {
    it('migrates non-interactively without prompting', async () => {
      const cfg = createTestKigumiConfig();
      const ctx = makeContext({
        output,
        cwd: '/tmp/k',
        isNonInteractive: true,
        existingConfig: cfg,
        previousTier: 'free',
      });

      const result = await handleTierMigration(ctx, makeConfigResult('pro'));

      expect(result.didMigrate).toBe(true);
      expect(vi.mocked(migratePackageReferences)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(migratePackageReferences)).toHaveBeenCalledWith(
        '/tmp/k',
        cfg,
        output
      );
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it('migrates when the user confirms in interactive mode', async () => {
      confirmSpy.mockResolvedValue(true);
      const cfg = createTestKigumiConfig();
      const ctx = makeContext({
        output,
        cwd: '/tmp/k',
        isNonInteractive: false,
        existingConfig: cfg,
        previousTier: 'free',
      });

      const result = await handleTierMigration(ctx, makeConfigResult('pro'));

      expect(result.didMigrate).toBe(true);
      expect(vi.mocked(migratePackageReferences)).toHaveBeenCalledTimes(1);
    });

    it('skips migration when the user declines in interactive mode', async () => {
      confirmSpy.mockResolvedValue(false);
      const cfg = createTestKigumiConfig();
      const ctx = makeContext({
        output,
        cwd: '/tmp/k',
        isNonInteractive: false,
        existingConfig: cfg,
        previousTier: 'free',
      });

      const result = await handleTierMigration(ctx, makeConfigResult('pro'));

      expect(result.didMigrate).toBe(false);
      expect(vi.mocked(migratePackageReferences)).not.toHaveBeenCalled();
    });

    it('skips migration when the user cancels the prompt', async () => {
      // p.confirm can resolve to a Symbol(cancel); isCancel returns true for it.
      confirmSpy.mockResolvedValue(Symbol('cancel') as unknown as boolean);
      isCancelSpy.mockReturnValue(true);
      const cfg = createTestKigumiConfig();
      const ctx = makeContext({
        output,
        cwd: '/tmp/k',
        isNonInteractive: false,
        existingConfig: cfg,
        previousTier: 'free',
      });

      const result = await handleTierMigration(ctx, makeConfigResult('pro'));

      expect(result.didMigrate).toBe(false);
      expect(vi.mocked(migratePackageReferences)).not.toHaveBeenCalled();
    });
  });

  describe('Pro -> Free downgrade', () => {
    it('reverse-migrates non-interactively without prompting', async () => {
      const cfg = createTestKigumiConfig();
      const ctx = makeContext({
        output,
        cwd: '/tmp/k',
        isNonInteractive: true,
        existingConfig: cfg,
        previousTier: 'pro',
      });

      const result = await handleTierMigration(ctx, makeConfigResult('free'));

      expect(result.didMigrate).toBe(true);
      expect(vi.mocked(reverseMigratePackageReferences)).toHaveBeenCalledTimes(
        1
      );
      expect(vi.mocked(reverseMigratePackageReferences)).toHaveBeenCalledWith(
        '/tmp/k',
        cfg,
        output
      );
      expect(confirmSpy).not.toHaveBeenCalled();
    });
  });
});

// Co-located so confirmInstallation lifts to the same coverage report; keeps
// the helper assertions next to the closely-shaped confirmMigration cases.
describe('confirmInstallation', () => {
  let confirmSpy: ReturnType<typeof vi.spyOn>;
  let isCancelSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    confirmSpy = vi.spyOn(p, 'confirm');
    isCancelSpy = vi.spyOn(p, 'isCancel').mockReturnValue(false);
  });

  afterEach(() => {
    confirmSpy.mockRestore();
    isCancelSpy.mockRestore();
  });

  it('returns true non-interactively without prompting', async () => {
    const result = await confirmInstallation(true);

    expect(result).toBe(true);
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('returns true when the user confirms', async () => {
    confirmSpy.mockResolvedValue(true);

    const result = await confirmInstallation(false);

    expect(result).toBe(true);
  });

  it('returns false when the user declines', async () => {
    confirmSpy.mockResolvedValue(false);

    const result = await confirmInstallation(false);

    expect(result).toBe(false);
  });

  it('returns false when the user cancels', async () => {
    confirmSpy.mockResolvedValue(Symbol('cancel') as unknown as boolean);
    isCancelSpy.mockReturnValue(true);

    const result = await confirmInstallation(false);

    expect(result).toBe(false);
  });
});
