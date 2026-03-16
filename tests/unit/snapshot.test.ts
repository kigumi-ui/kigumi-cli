/**
 * Snapshot Utility Tests
 *
 * Tests for src/utils/snapshot.ts - Snapshot CRUD operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  getSnapshotDir,
  saveSnapshot,
  loadSnapshot,
  hasSnapshot,
  deleteSnapshot,
} from '../../src/utils/snapshot.js';

describe('snapshot', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-snapshot-test-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('getSnapshotDir', () => {
    it('should return correct path construction', () => {
      const dir = getSnapshotDir('/project', 'Button');
      expect(dir).toBe(path.join('/project', '.kigumi/snapshots', 'Button'));
    });
  });

  describe('saveSnapshot and loadSnapshot', () => {
    it('should save and load roundtrip', async () => {
      const files = {
        'Button.tsx': '// component code',
        'Button.css': '/* css */',
        'Button.test.tsx': '// test code',
      };

      await saveSnapshot(tempDir, 'Button', files);
      const loaded = await loadSnapshot(tempDir, 'Button');

      expect(loaded).toEqual(files);
    });

    it('should auto-create .kigumi/snapshots/ directories', async () => {
      await saveSnapshot(tempDir, 'Card', { 'Card.tsx': '// code' });

      const dirExists = await fs.pathExists(
        path.join(tempDir, '.kigumi/snapshots/Card')
      );
      expect(dirExists).toBe(true);
    });

    it('should overwrite with different content', async () => {
      await saveSnapshot(tempDir, 'Button', { 'Button.tsx': 'v1' });
      await saveSnapshot(tempDir, 'Button', { 'Button.tsx': 'v2' });

      const loaded = await loadSnapshot(tempDir, 'Button');
      expect(loaded?.['Button.tsx']).toBe('v2');
    });

    it('should store multiple components independently', async () => {
      await saveSnapshot(tempDir, 'Button', { 'Button.tsx': 'btn code' });
      await saveSnapshot(tempDir, 'Dialog', { 'Dialog.tsx': 'dlg code' });

      const btn = await loadSnapshot(tempDir, 'Button');
      const dlg = await loadSnapshot(tempDir, 'Dialog');

      expect(btn?.['Button.tsx']).toBe('btn code');
      expect(dlg?.['Dialog.tsx']).toBe('dlg code');
    });
  });

  describe('loadSnapshot', () => {
    it('should return null for non-existent snapshot', async () => {
      const result = await loadSnapshot(tempDir, 'NonExistent');
      expect(result).toBeNull();
    });
  });

  describe('hasSnapshot', () => {
    it('should return true when snapshot exists', async () => {
      await saveSnapshot(tempDir, 'Button', { 'Button.tsx': 'code' });
      expect(await hasSnapshot(tempDir, 'Button')).toBe(true);
    });

    it('should return false when snapshot does not exist', async () => {
      expect(await hasSnapshot(tempDir, 'Missing')).toBe(false);
    });
  });

  describe('deleteSnapshot', () => {
    it('should delete existing snapshot', async () => {
      await saveSnapshot(tempDir, 'Button', { 'Button.tsx': 'code' });
      await deleteSnapshot(tempDir, 'Button');

      expect(await hasSnapshot(tempDir, 'Button')).toBe(false);
      expect(await loadSnapshot(tempDir, 'Button')).toBeNull();
    });

    it('should not error on non-existent snapshot', async () => {
      await expect(
        deleteSnapshot(tempDir, 'NonExistent')
      ).resolves.not.toThrow();
    });
  });
});
