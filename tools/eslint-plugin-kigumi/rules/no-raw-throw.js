// @ts-check
/**
 * `throw new Error(...)` in src/ loses the structured metadata that the classes
 * in src/errors/ carry.
 *
 * A raw Error reaches handleError as UnknownError: exit code 1 regardless of
 * what went wrong, no semantic code, and the generic "this is an unexpected
 * error" suggestion instead of an actionable one. src/AGENTS.md documents
 * typed errors as the convention; this rule is what keeps the count at zero.
 *
 * The taxonomy lives in src/errors/, so the rule deliberately does not police
 * *which* class is thrown - only that the raw builtin is not.
 */

/** Builtin error constructors that should never be thrown directly from src/. */
const BUILTIN_ERRORS = new Set([
  'Error',
  'TypeError',
  'RangeError',
  'SyntaxError',
  'ReferenceError',
  'EvalError',
  'URIError',
]);

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'disallow throwing builtin Error types; use the classes in src/errors/',
    },
    schema: [],
    messages: {
      rawThrow:
        'Throwing a raw {{name}} loses the error code, exit code and suggestions. Throw a class from src/errors/ instead (InternalInvariantError for an unreachable condition).',
    },
  },

  create(context) {
    return {
      ThrowStatement(node) {
        const arg = node.argument;
        if (
          arg &&
          arg.type === 'NewExpression' &&
          arg.callee.type === 'Identifier' &&
          BUILTIN_ERRORS.has(arg.callee.name)
        ) {
          context.report({
            node: arg,
            messageId: 'rawThrow',
            data: { name: arg.callee.name },
          });
        }
      },
    };
  },
};

export default rule;
