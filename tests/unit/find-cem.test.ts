import { describe, it, expect, afterEach, vi } from 'vitest';
import fsExtra from 'fs-extra';
import {
  findCustomElementsJson,
  findCustomElementsJsonSync,
} from '../../scripts/find-cem.js';

// Two versions hoisted in the pnpm store: a stale higher one (3.9.0) and the
// version pinned in docs/package.json (3.6.0). The legacy ".sort().reverse()"
// logic would pick 3.9.0; the pin-aware logic must pick 3.6.0 (finding F-152).
const STORE_DIRS = [
  'some-other-pkg@1.0.0',
  '@awesome.me+webawesome-pro@3.9.0_@floating-ui+utils@0.2.10_@types+react@19.2.14',
  '@awesome.me+webawesome-pro@3.6.0_@floating-ui+utils@0.2.10_@types+react@19.2.14',
];

function pinPackageJson(version: string | undefined) {
  return {
    dependencies: version ? { '@awesome.me/webawesome-pro': version } : {},
  };
}

describe('find-cem version resolution (F-152)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('findCustomElementsJsonSync', () => {
    it('prefers the pinned version over a higher one in the store', () => {
      vi.spyOn(fsExtra, 'readJsonSync').mockReturnValue(
        pinPackageJson('3.6.0')
      );
      vi.spyOn(fsExtra, 'pathExistsSync').mockReturnValue(true);
      vi.spyOn(fsExtra, 'readdirSync').mockReturnValue(
        STORE_DIRS as unknown as ReturnType<typeof fsExtra.readdirSync>
      );

      const result = findCustomElementsJsonSync();

      expect(result).toContain('@awesome.me+webawesome-pro@3.6.0');
      expect(result).not.toContain('@awesome.me+webawesome-pro@3.9.0');
    });

    it('falls back to highest-version-wins when no pin is resolvable', () => {
      vi.spyOn(fsExtra, 'readJsonSync').mockImplementation(() => {
        throw new Error('no docs/package.json');
      });
      vi.spyOn(fsExtra, 'pathExistsSync').mockReturnValue(true);
      vi.spyOn(fsExtra, 'readdirSync').mockReturnValue(
        STORE_DIRS as unknown as ReturnType<typeof fsExtra.readdirSync>
      );

      const result = findCustomElementsJsonSync();

      expect(result).toContain('@awesome.me+webawesome-pro@3.9.0');
    });

    it('falls back to highest-version-wins when the pin is absent from the store', () => {
      vi.spyOn(fsExtra, 'readJsonSync').mockReturnValue(
        pinPackageJson('3.7.0')
      );
      vi.spyOn(fsExtra, 'pathExistsSync').mockReturnValue(true);
      vi.spyOn(fsExtra, 'readdirSync').mockReturnValue(
        STORE_DIRS as unknown as ReturnType<typeof fsExtra.readdirSync>
      );

      const result = findCustomElementsJsonSync();

      expect(result).toContain('@awesome.me+webawesome-pro@3.9.0');
    });
  });

  describe('findCustomElementsJson (async)', () => {
    it('prefers the pinned version over a higher one in the store', async () => {
      vi.spyOn(fsExtra, 'readJsonSync').mockReturnValue(
        pinPackageJson('3.6.0')
      );
      vi.spyOn(fsExtra, 'pathExists').mockResolvedValue(
        true as unknown as void
      );
      vi.spyOn(fsExtra, 'readdir').mockResolvedValue(
        STORE_DIRS as unknown as ReturnType<typeof fsExtra.readdir>
      );

      const result = await findCustomElementsJson();

      expect(result).toContain('@awesome.me+webawesome-pro@3.6.0');
      expect(result).not.toContain('@awesome.me+webawesome-pro@3.9.0');
    });

    it('falls back to highest-version-wins when no pin is resolvable', async () => {
      vi.spyOn(fsExtra, 'readJsonSync').mockImplementation(() => {
        throw new Error('no docs/package.json');
      });
      vi.spyOn(fsExtra, 'pathExists').mockResolvedValue(
        true as unknown as void
      );
      vi.spyOn(fsExtra, 'readdir').mockResolvedValue(
        STORE_DIRS as unknown as ReturnType<typeof fsExtra.readdir>
      );

      const result = await findCustomElementsJson();

      expect(result).toContain('@awesome.me+webawesome-pro@3.9.0');
    });
  });
});
