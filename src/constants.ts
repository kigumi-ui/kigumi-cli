/**
 * Central Constants for Kigumi CLI
 *
 * PURPOSE: Single source of truth for magic strings and configuration values.
 * Changes here propagate to the entire codebase.
 *
 * @see AGENTS.md for usage context
 */

// =============================================================================
// Package Names
// =============================================================================

/** Free tier npm package name */
export const WEB_AWESOME_FREE_PACKAGE = '@awesome.me/webawesome';

/** Pro tier npm package name */
export const WEB_AWESOME_PRO_PACKAGE = '@awesome.me/webawesome-pro';

/** Scope for Web Awesome packages */
export const WEB_AWESOME_SCOPE = '@awesome.me';

// =============================================================================
// Web Component Configuration
// =============================================================================

/** Prefix for all Web Awesome custom elements (e.g., wa-button, wa-card) */
export const WEB_COMPONENT_PREFIX = 'wa-';

// =============================================================================
// Environment Variables
// =============================================================================

/** Environment variable key for Pro tier authentication token */
export const ENV_TOKEN_KEY = 'WEBAWESOME_NPM_TOKEN';

/**
 * Minimum valid token length for Pro tier
 *
 * WHY: Cloudsmith tokens are typically 40+ chars. 10 is a safety threshold
 * to avoid accepting malformed/empty values like "=" or "token".
 */
export const MIN_TOKEN_LENGTH = 10;

// =============================================================================
// File Names
// =============================================================================

/** Kigumi configuration file name */
export const CONFIG_FILE_NAME = 'kigumi.config.json';

/** Environment variables file name */
export const ENV_FILE_NAME = '.env';

/** NPM registry configuration file name */
export const NPMRC_FILE_NAME = '.npmrc';

/** Web Awesome imports file (generated) */
export const WEBAWESOME_IMPORTS_FILE = 'webawesome.ts';

/** Theme CSS file (generated) */
export const THEME_CSS_FILE = 'theme.css';

/** Vite environment types file */
export const VITE_ENV_DTS_FILE = 'vite-env.d.ts';

// =============================================================================
// NPM Registry URLs
// =============================================================================

/** Public npm registry for Free tier */
export const NPM_PUBLIC_REGISTRY = 'https://registry.npmjs.org/';

/** Cloudsmith registry for Pro tier */
export const NPM_PRO_REGISTRY =
  'https://npm.cloudsmith.io/fortawesome/webawesome-pro';

// =============================================================================
// Regex Patterns
// =============================================================================

/**
 * Regex to match Free package imports
 * WHY: Matches @awesome.me/webawesome but NOT @awesome.me/webawesome-pro
 */
export const FREE_PACKAGE_REGEX = /@awesome\.me\/webawesome(?!-pro)/g;

/**
 * Regex to match Pro package imports
 */
export const PRO_PACKAGE_REGEX = /@awesome\.me\/webawesome-pro/g;

/**
 * Regex to extract token from .env file
 * WHY: Matches WEBAWESOME_NPM_TOKEN with optional whitespace around =
 */
export const ENV_TOKEN_REGEX = /^\s*WEBAWESOME_NPM_TOKEN\s*=\s*(.+?)\s*$/m;

// =============================================================================
// Default Paths
// =============================================================================

/** Default components directory */
export const DEFAULT_COMPONENTS_DIR = 'src/components/ui';

/** Default utils/lib directory */
export const DEFAULT_UTILS_DIR = 'src/lib';

/** Default styles directory */
export const DEFAULT_STYLES_DIR = 'src/styles';

// =============================================================================
// Exit Codes
// =============================================================================

/** Successful exit */
export const EXIT_SUCCESS = 0;

/** Error exit */
export const EXIT_ERROR = 1;

// =============================================================================
// Timeouts
// =============================================================================

/** Install command timeout in milliseconds (5 minutes) */
export const INSTALL_TIMEOUT_MS = 300_000;

// =============================================================================
// Web Awesome Version
// =============================================================================

/** Default Web Awesome package version */
export const DEFAULT_WEBAWESOME_VERSION = '^3.1.0';
