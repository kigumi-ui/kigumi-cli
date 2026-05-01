/**
 * Tests for the `registry` commander router.
 *
 * Two surfaces:
 * 1. Structural assertion: catches accidental sub-command removal.
 * 2. Wiring assertion: each sub-command's action callback dispatches to the
 *    expected action function. Action modules are mocked so the test verifies
 *    routing, not action behavior. (Cluster S note: these mocks scope to
 *    routing verification only; they don't replace integration coverage.)
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/commands/registry/init.js', () => ({
  registryInitAction: vi.fn(),
}));
vi.mock('../../src/commands/registry/validate.js', () => ({
  registryValidateAction: vi.fn(),
}));
vi.mock('../../src/commands/registry/add-source.js', () => ({
  registryConnectAction: vi.fn(),
}));
vi.mock('../../src/commands/registry/list-sources.js', () => ({
  registryListSourcesAction: vi.fn(),
}));
vi.mock('../../src/commands/registry/remove-source.js', () => ({
  registryRemoveSourceAction: vi.fn(),
}));
vi.mock('../../src/commands/registry/add-component.js', () => ({
  registryAddComponentAction: vi.fn(),
}));
vi.mock('../../src/commands/registry/add-theme.js', () => ({
  registryAddThemeAction: vi.fn(),
}));

// Module-scope dynamic imports: vi.mock calls above are hoisted, but the real
// modules must be loaded AFTER the mocks register, hence the top-level await
// instead of static imports. Keep these at module scope (not in beforeAll) so
// the mocked bindings stay stable across both `it` blocks below.
const { registryCommand } = await import('../../src/commands/registry.js');
const { registryInitAction } =
  await import('../../src/commands/registry/init.js');
const { registryValidateAction } =
  await import('../../src/commands/registry/validate.js');
const { registryConnectAction } =
  await import('../../src/commands/registry/add-source.js');
const { registryListSourcesAction } =
  await import('../../src/commands/registry/list-sources.js');
const { registryRemoveSourceAction } =
  await import('../../src/commands/registry/remove-source.js');
const { registryAddComponentAction } =
  await import('../../src/commands/registry/add-component.js');
const { registryAddThemeAction } =
  await import('../../src/commands/registry/add-theme.js');

describe('registryCommand', () => {
  it('exposes all expected sub-commands', () => {
    const names = registryCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual(
      [
        'add-component',
        'add-theme',
        'connect',
        'init',
        'list',
        'remove',
        'validate',
      ].sort()
    );
  });

  it('routes each sub-command to its expected action function', async () => {
    // commander allowExcessArguments lets us invoke without parsing real argv.
    await registryCommand.parseAsync(['init'], { from: 'user' });
    expect(registryInitAction).toHaveBeenCalledTimes(1);

    await registryCommand.parseAsync(['validate'], { from: 'user' });
    expect(registryValidateAction).toHaveBeenCalledTimes(1);

    await registryCommand.parseAsync(['connect', 'https://example.test'], {
      from: 'user',
    });
    expect(registryConnectAction).toHaveBeenCalledTimes(1);
    expect(registryConnectAction).toHaveBeenLastCalledWith(
      'https://example.test',
      expect.anything()
    );

    await registryCommand.parseAsync(['list'], { from: 'user' });
    expect(registryListSourcesAction).toHaveBeenCalledTimes(1);

    await registryCommand.parseAsync(['remove', 'some-source'], {
      from: 'user',
    });
    expect(registryRemoveSourceAction).toHaveBeenCalledTimes(1);
    expect(registryRemoveSourceAction).toHaveBeenLastCalledWith(
      'some-source',
      expect.anything()
    );

    await registryCommand.parseAsync(['add-component'], { from: 'user' });
    expect(registryAddComponentAction).toHaveBeenCalledTimes(1);

    await registryCommand.parseAsync(['add-theme'], { from: 'user' });
    expect(registryAddThemeAction).toHaveBeenCalledTimes(1);
  });
});
