/**
 * Tests for the `registry` commander router.
 *
 * Two surfaces:
 * 1. Structural assertion: catches accidental sub-command removal.
 * 2. Wiring assertion: each sub-command's action callback dispatches to the
 *    expected action function. Action modules are spied so the test verifies
 *    routing, not action behavior. (Cluster S note: these spies scope to
 *    routing verification only; they don't replace integration coverage.)
 *
 * Cluster S / PR-S4: switched from 7 module-level factory mocks +
 * top-level-await dynamic imports to namespace imports + per-test
 * `vi.spyOn`. Production registry.ts wraps each action in an arrow
 * (`.action((options) => registryInitAction(options))`), so ESM live
 * bindings let the spy intercept at call time.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registryCommand } from '../../src/commands/registry.js';
import * as initModule from '../../src/commands/registry/init.js';
import * as validateModule from '../../src/commands/registry/validate.js';
import * as addSourceModule from '../../src/commands/registry/add-source.js';
import * as listSourcesModule from '../../src/commands/registry/list-sources.js';
import * as removeSourceModule from '../../src/commands/registry/remove-source.js';
import * as addComponentModule from '../../src/commands/registry/add-component.js';
import * as addThemeModule from '../../src/commands/registry/add-theme.js';

describe('registryCommand', () => {
  beforeEach(() => {
    vi.spyOn(initModule, 'registryInitAction').mockResolvedValue(undefined);
    vi.spyOn(validateModule, 'registryValidateAction').mockResolvedValue(
      undefined
    );
    vi.spyOn(addSourceModule, 'registryConnectAction').mockResolvedValue(
      undefined
    );
    vi.spyOn(listSourcesModule, 'registryListSourcesAction').mockResolvedValue(
      undefined
    );
    vi.spyOn(
      removeSourceModule,
      'registryRemoveSourceAction'
    ).mockResolvedValue(undefined);
    vi.spyOn(
      addComponentModule,
      'registryAddComponentAction'
    ).mockResolvedValue(undefined);
    vi.spyOn(addThemeModule, 'registryAddThemeAction').mockResolvedValue(
      undefined
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    expect(initModule.registryInitAction).toHaveBeenCalledTimes(1);

    await registryCommand.parseAsync(['validate'], { from: 'user' });
    expect(validateModule.registryValidateAction).toHaveBeenCalledTimes(1);

    await registryCommand.parseAsync(['connect', 'https://example.test'], {
      from: 'user',
    });
    expect(addSourceModule.registryConnectAction).toHaveBeenCalledTimes(1);
    expect(addSourceModule.registryConnectAction).toHaveBeenLastCalledWith(
      'https://example.test',
      expect.anything()
    );

    await registryCommand.parseAsync(['list'], { from: 'user' });
    expect(listSourcesModule.registryListSourcesAction).toHaveBeenCalledTimes(
      1
    );

    await registryCommand.parseAsync(['remove', 'some-source'], {
      from: 'user',
    });
    expect(removeSourceModule.registryRemoveSourceAction).toHaveBeenCalledTimes(
      1
    );
    expect(
      removeSourceModule.registryRemoveSourceAction
    ).toHaveBeenLastCalledWith('some-source', expect.anything());

    await registryCommand.parseAsync(['add-component'], { from: 'user' });
    expect(addComponentModule.registryAddComponentAction).toHaveBeenCalledTimes(
      1
    );

    await registryCommand.parseAsync(['add-theme'], { from: 'user' });
    expect(addThemeModule.registryAddThemeAction).toHaveBeenCalledTimes(1);
  });
});
