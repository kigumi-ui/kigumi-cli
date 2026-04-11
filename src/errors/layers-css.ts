/**
 * layers.css Error Classes
 *
 * Errors raised by the surgical rewrite of `layers.css` during tier
 * migration and `kigumi doctor` recovery.
 */

import { KigumiError, ErrorCode, type ErrorSuggestion } from './base.js';
import { GITHUB_REPO_URL } from '../constants.js';

/**
 * Thrown when the surgical rewrite cannot locate the expected
 * `@import '<package>/dist/styles/webawesome.css'` pattern in a
 * user's `layers.css`.
 *
 * Typically means the user restructured the file (renamed imports,
 * removed the cascade layers, switched to a custom setup). Migration
 * cannot safely rewrite it automatically, so we surface an actionable
 * error with the exact manual fix.
 */
export class LayersCssRewriteError extends KigumiError {
  constructor(
    filePath: string,
    currentPackage: string,
    targetPackage: string,
    themeName: string
  ) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Update the imports manually',
        steps: [
          `Open ${filePath}`,
          `Replace: @import '${currentPackage}/dist/styles/webawesome.css' ...`,
          `With:    @import '${targetPackage}/dist/styles/webawesome.css' ...`,
          `Replace: @import '${currentPackage}/dist/styles/themes/${themeName}.css' ...`,
          `With:    @import '${targetPackage}/dist/styles/themes/${themeName}.css' ...`,
          'Save the file and restart your dev server',
        ],
      },
      {
        title: 'Or restore the default layers.css',
        steps: [
          `See the reference implementation at:`,
          `${GITHUB_REPO_URL}/blob/main/src/utils/regenerate.ts`,
          `Look for the "generateLayersCSS" function`,
          'Copy its template output into your layers.css',
          'Then re-run migration',
        ],
      },
    ];

    super(
      ErrorCode.MIGRATION_PARSE_ERROR,
      `Cannot migrate layers.css automatically: expected @import pattern not found in ${filePath}`,
      { filePath, currentPackage, targetPackage, themeName },
      suggestions
    );
  }
}
