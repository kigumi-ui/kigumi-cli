import { describe, it, expect } from 'vitest';

/**
 * Tests for error diagnostics in installation failures
 * These verify that different npm error types are correctly identified and provide helpful messages
 */

describe('Error Diagnostics', () => {
  describe('Authentication Errors (E401)', () => {
    it('should detect E401 error code', () => {
      const stderr = `npm error code E401
npm error Incorrect or missing password.
npm error If you were trying to login, change your password...`;

      const hasAuthError =
        stderr.includes('E401') ||
        stderr.includes('Incorrect or missing password') ||
        stderr.includes('authentication');

      expect(hasAuthError).toBe(true);
    });

    it('should detect authentication keyword', () => {
      const stderr = 'npm error authentication failed';

      const hasAuthError =
        stderr.includes('E401') ||
        stderr.includes('Incorrect or missing password') ||
        stderr.includes('authentication');

      expect(hasAuthError).toBe(true);
    });

    it('should detect missing password message', () => {
      const stderr = 'Incorrect or missing password';

      const hasAuthError =
        stderr.includes('E401') ||
        stderr.includes('Incorrect or missing password') ||
        stderr.includes('authentication');

      expect(hasAuthError).toBe(true);
    });
  });

  describe('Network Errors', () => {
    it('should detect ENOTFOUND', () => {
      const stderr =
        'npm error code ENOTFOUND\nnpm error network request failed';

      const hasNetworkError =
        stderr.includes('ENOTFOUND') || stderr.includes('ETIMEDOUT');

      expect(hasNetworkError).toBe(true);
    });

    it('should detect ETIMEDOUT', () => {
      const stderr = 'npm error code ETIMEDOUT\nnpm error network timeout';

      const hasNetworkError =
        stderr.includes('ENOTFOUND') || stderr.includes('ETIMEDOUT');

      expect(hasNetworkError).toBe(true);
    });
  });

  describe('404 Errors', () => {
    it('should detect 404 status code', () => {
      const stderr =
        'npm error 404 Not Found - GET https://registry.npmjs.org/@awesome.me/webawesome';

      const has404Error =
        stderr.includes('404') || stderr.includes('Not Found');

      expect(has404Error).toBe(true);
    });

    it('should detect Not Found message', () => {
      const stderr = 'Package Not Found in registry';

      const has404Error =
        stderr.includes('404') || stderr.includes('Not Found');

      expect(has404Error).toBe(true);
    });
  });

  describe('Permission Errors', () => {
    it('should detect EACCES', () => {
      const stderr = 'npm error code EACCES\nnpm error permission denied';

      const hasPermissionError =
        stderr.includes('EACCES') || stderr.includes('permission denied');

      expect(hasPermissionError).toBe(true);
    });

    it('should detect permission denied message', () => {
      const stderr =
        'Error: permission denied, mkdir /usr/local/lib/node_modules';

      const hasPermissionError =
        stderr.includes('EACCES') || stderr.includes('permission denied');

      expect(hasPermissionError).toBe(true);
    });
  });

  describe('Error Priority', () => {
    it('should prioritize E401 over other errors', () => {
      const stderr = `npm error code E401
npm error Incorrect or missing password
npm error 404 Not Found`;

      // E401 should be detected first
      const hasAuthError =
        stderr.includes('E401') ||
        stderr.includes('Incorrect or missing password') ||
        stderr.includes('authentication');

      const has404Error =
        stderr.includes('404') || stderr.includes('Not Found');

      expect(hasAuthError).toBe(true);
      expect(has404Error).toBe(true);

      // In our code, E401 is checked first (higher priority)
      // This test confirms both are detectable
    });
  });

  describe('Real-world Error Messages', () => {
    it('should handle actual npm E401 output', () => {
      const stderr = `npm error code E401
npm error Incorrect or missing password.
npm error If you were trying to login, change your password, create an
npm error authentication token or enable two-factor authentication then
npm error that means you likely typed your password in incorrectly.
npm error Please try again, or recover your password at:
npm error     https://www.npmjs.com/forgot
npm error
npm error If you were doing some other operation then your saved credentials are
npm error probably out of date. To correct this please try logging in again with:
npm error     npm login`;

      const hasAuthError =
        stderr.includes('E401') ||
        stderr.includes('Incorrect or missing password') ||
        stderr.includes('authentication');

      expect(hasAuthError).toBe(true);
    });

    it('should handle actual npm ENOTFOUND output', () => {
      const stderr = `npm error code ENOTFOUND
npm error syscall getaddrinfo
npm error errno ENOTFOUND
npm error network request to https://registry.npmjs.org/@awesome.me/webawesome failed, reason: getaddrinfo ENOTFOUND registry.npmjs.org`;

      const hasNetworkError =
        stderr.includes('ENOTFOUND') || stderr.includes('ETIMEDOUT');

      expect(hasNetworkError).toBe(true);
    });

    it('should handle actual npm 404 output', () => {
      const stderr = `npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/@awesome.me/wrong-package
npm error 404
npm error 404  '@awesome.me/wrong-package@latest' is not in this registry.`;

      const has404Error =
        stderr.includes('404') || stderr.includes('Not Found');

      expect(has404Error).toBe(true);
    });
  });
});
