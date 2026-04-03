/**
 * File Diff Utility Tests
 *
 * Tests for src/utils/file-diff.ts - Modification detection for component files
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  checkFileModification,
  getModifiedFiles,
} from '../../src/utils/file-diff.js';

describe('file-diff', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-diff-test-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('checkFileModification', () => {
    it('should return exists:false for non-existent files', async () => {
      const result = await checkFileModification(
        path.join(tempDir, 'missing.tsx'),
        'generated content'
      );

      expect(result.exists).toBe(false);
      expect(result.modified).toBe(false);
      expect(result.fileName).toBe('missing.tsx');
    });

    it('should detect unmodified files (identical content)', async () => {
      const content = '.Button { color: red; }\n';
      const filePath = path.join(tempDir, 'Button.css');
      await fs.writeFile(filePath, content);

      const result = await checkFileModification(filePath, content);

      expect(result.exists).toBe(true);
      expect(result.modified).toBe(false);
    });

    it('should detect modified files (different content)', async () => {
      const filePath = path.join(tempDir, 'Button.css');
      await fs.writeFile(filePath, '.Button { color: blue; }\n');

      const result = await checkFileModification(
        filePath,
        '.Button { color: red; }\n'
      );

      expect(result.exists).toBe(true);
      expect(result.modified).toBe(true);
    });

    it('should ignore trailing whitespace differences', async () => {
      const filePath = path.join(tempDir, 'Button.css');
      await fs.writeFile(filePath, '.Button { }\n\n');

      const result = await checkFileModification(filePath, '.Button { }\n');

      expect(result.exists).toBe(true);
      expect(result.modified).toBe(false);
    });

    it('should include existingContent when file exists and is modified', async () => {
      const content = '.Button { color: blue; }\n';
      const filePath = path.join(tempDir, 'Button.css');
      await fs.writeFile(filePath, content);

      const result = await checkFileModification(
        filePath,
        '.Button { color: red; }\n'
      );

      expect(result.existingContent).toBe(content);
    });

    it('should include existingContent when file exists and is unmodified', async () => {
      const content = '.Button { color: red; }\n';
      const filePath = path.join(tempDir, 'Button.css');
      await fs.writeFile(filePath, content);

      const result = await checkFileModification(filePath, content);

      expect(result.existingContent).toBe(content);
    });

    it('should not include existingContent when file does not exist', async () => {
      const result = await checkFileModification(
        path.join(tempDir, 'missing.tsx'),
        'generated content'
      );

      expect(result.existingContent).toBeUndefined();
    });

    it('should return the correct fileName', async () => {
      const filePath = path.join(tempDir, 'sub', 'Page.css');
      // File does not exist, but fileName should still be extracted
      const result = await checkFileModification(filePath, 'content');

      expect(result.fileName).toBe('Page.css');
      expect(result.filePath).toBe(filePath);
    });
  });

  describe('getModifiedFiles', () => {
    it('should return only modified files', () => {
      const checks = [
        {
          filePath: '/a/Button.tsx',
          fileName: 'Button.tsx',
          exists: true,
          modified: false,
        },
        {
          filePath: '/a/Button.css',
          fileName: 'Button.css',
          exists: true,
          modified: true,
        },
        {
          filePath: '/a/Button.test.tsx',
          fileName: 'Button.test.tsx',
          exists: false,
          modified: false,
        },
      ];

      const modified = getModifiedFiles(checks);

      expect(modified).toHaveLength(1);
      expect(modified[0].fileName).toBe('Button.css');
    });

    it('should return empty array when no files are modified', () => {
      const checks = [
        {
          filePath: '/a/Button.tsx',
          fileName: 'Button.tsx',
          exists: true,
          modified: false,
        },
        {
          filePath: '/a/Button.css',
          fileName: 'Button.css',
          exists: true,
          modified: false,
        },
      ];

      expect(getModifiedFiles(checks)).toHaveLength(0);
    });

    it('should return all files when all are modified', () => {
      const checks = [
        {
          filePath: '/a/Button.tsx',
          fileName: 'Button.tsx',
          exists: true,
          modified: true,
        },
        {
          filePath: '/a/Button.css',
          fileName: 'Button.css',
          exists: true,
          modified: true,
        },
      ];

      expect(getModifiedFiles(checks)).toHaveLength(2);
    });
  });
});
