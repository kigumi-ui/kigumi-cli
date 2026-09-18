// @ts-check
/**
 * Commands are leaf nodes: they may import from utils/, schemas/, errors/,
 * output/ and so on, but never from a sibling command's directory.
 *
 * The one violation was `src/commands/upgrade.ts` importing
 * `./init/installer.js`, which made a function that both `init` and `upgrade`
 * needed live under one of them. Moving it to `utils/dependency-installer.ts`
 * fixed the instance; this rule stops the pattern coming back. See issue #4.
 *
 * Resolving the import against the importing file's own path is what makes
 * this reliable. A glob over the import string cannot tell `./init/installer`
 * (a violation) from `./add/index` (a barrel importing its own subdirectory),
 * because the two are the same shape.
 */

import path from 'path';

/**
 * Returns the command a file under src/commands/ belongs to, or null.
 *
 * @param {string} absPath
 * @returns {string | null}
 */
function commandOf(absPath) {
  const parts = absPath.split(path.sep);
  const i = parts.lastIndexOf('commands');
  if (i === -1 || i + 1 >= parts.length) return null;

  const next = parts[i + 1];
  // src/commands/upgrade.ts -> the command is 'upgrade'
  // src/commands/add/index.ts -> the command is 'add'
  return next.endsWith('.ts') ? next.slice(0, -3) : next;
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'disallow importing from another command; shared code belongs in src/utils/',
    },
    schema: [],
    messages: {
      crossCommand:
        "'{{source}}' reaches into the '{{target}}' command. Commands are leaf nodes: move the shared code to src/utils/ instead.",
    },
  },

  create(context) {
    const filename = context.filename;
    const self = commandOf(filename);
    if (self === null) return {};

    /**
     * @param {import('eslint').Rule.Node} node
     * @param {unknown} source
     */
    function check(node, source) {
      if (typeof source !== 'string' || !source.startsWith('.')) return;

      const resolved = path.resolve(path.dirname(filename), source);
      const target = commandOf(resolved);

      // Not under commands/ at all (utils/, schemas/, ...), or part of this
      // same command's own directory: both fine.
      if (target === null || target === self) return;

      context.report({
        node,
        messageId: 'crossCommand',
        data: { source, target },
      });
    }

    return {
      ImportDeclaration(node) {
        check(node, node.source.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source) check(node, node.source.value);
      },
      ExportAllDeclaration(node) {
        if (node.source) check(node, node.source.value);
      },
    };
  },
};

export default rule;
