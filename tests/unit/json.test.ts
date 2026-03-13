/**
 * JSON Utilities Tests
 *
 * Tests the stripJSONComments state-machine parser to ensure it correctly
 * handles string literals, single-line and multi-line comments.
 */

import { describe, it, expect } from 'vitest';
import { stripJSONComments } from '../../src/utils/json.js';

describe('stripJSONComments', () => {
  it('should return plain JSON unchanged', () => {
    const input = '{"key": "value", "num": 42}';
    expect(stripJSONComments(input)).toBe(input);
  });

  it('should strip single-line comments', () => {
    const input = '{\n  // this is a comment\n  "key": "value"\n}';
    expect(stripJSONComments(input)).toBe('{\n  \n  "key": "value"\n}');
  });

  it('should strip multi-line comments', () => {
    const input = '{\n  /* multi\n     line */\n  "key": "value"\n}';
    expect(stripJSONComments(input)).toBe('{\n  \n  "key": "value"\n}');
  });

  it('should preserve /* inside string literals (glob patterns)', () => {
    const input = '{"include": ["src/**/*.ts"]}';
    expect(stripJSONComments(input)).toBe(input);
  });

  it('should preserve // inside string literals', () => {
    const input = '{"url": "https://example.com"}';
    expect(stripJSONComments(input)).toBe(input);
  });

  it('should handle escaped quotes inside strings', () => {
    const input = '{"key": "value with \\"escaped\\" quotes"}';
    expect(stripJSONComments(input)).toBe(input);
  });

  it('should handle escaped backslash before closing quote', () => {
    const input = '{"path": "C:\\\\"}';
    expect(stripJSONComments(input)).toBe(input);
  });

  it('should handle mixed comments and strings', () => {
    const input =
      '{\n  // comment\n  "include": ["src/**/*.ts"], /* block */\n  "key": "val"\n}';
    const expected = '{\n  \n  "include": ["src/**/*.ts"], \n  "key": "val"\n}';
    expect(stripJSONComments(input)).toBe(expected);
  });

  it('should handle empty input', () => {
    expect(stripJSONComments('')).toBe('');
  });

  it('should handle trailing comment without newline', () => {
    const input = '{"key": "value"} // trailing';
    expect(stripJSONComments(input)).toBe('{"key": "value"} ');
  });
});
