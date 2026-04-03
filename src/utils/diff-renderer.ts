/**
 * Diff Renderer
 *
 * Renders a colored unified diff in the terminal using node-diff3's
 * diffPatch algorithm. Used by `add --force`, `update`, and `diff`
 * commands to show what changed.
 *
 * @public
 */

import pc from 'picocolors';
import { diffPatch, type IPatchRes } from 'node-diff3';

const CONTEXT_LINES = 3;

interface RenderDiffOptions {
  /** Maximum number of lines to show per hunk (default: unlimited) */
  maxLines?: number;
}

/**
 * Render a colored unified diff between two strings.
 * Returns the formatted diff string, or empty string if identical.
 */
export function renderDiff(
  oldContent: string,
  newContent: string,
  fileName: string,
  options: RenderDiffOptions = {}
): string {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  // Fast path: identical content
  if (oldContent === newContent) {
    return '';
  }

  const patches = diffPatch(oldLines, newLines);
  if (patches.length === 0) {
    return '';
  }

  const hunks = buildHunks(oldLines, newLines, patches);
  return formatHunks(hunks, fileName, options);
}

interface DiffLine {
  type: 'context' | 'remove' | 'add';
  content: string;
  oldLineNo?: number;
  newLineNo?: number;
}

interface Hunk {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: DiffLine[];
}

/**
 * Build hunks with context lines from raw patches.
 */
function buildHunks(
  oldLines: string[],
  newLines: string[],
  patches: IPatchRes<string>[]
): Hunk[] {
  const hunks: Hunk[] = [];

  for (const patch of patches) {
    const oldStart = patch.buffer1.offset;
    const oldCount = patch.buffer1.length;
    const newStart = patch.buffer2.offset;
    const newCount = patch.buffer2.length;

    // Context before
    const contextStart = Math.max(0, oldStart - CONTEXT_LINES);
    const lines: DiffLine[] = [];

    for (let i = contextStart; i < oldStart; i++) {
      lines.push({
        type: 'context',
        content: oldLines[i],
        oldLineNo: i + 1,
        newLineNo: newStart - (oldStart - i) + 1,
      });
    }

    // Removed lines
    for (let i = 0; i < oldCount; i++) {
      lines.push({
        type: 'remove',
        content: patch.buffer1.chunk[i],
        oldLineNo: oldStart + i + 1,
      });
    }

    // Added lines
    for (let i = 0; i < newCount; i++) {
      lines.push({
        type: 'add',
        content: patch.buffer2.chunk[i],
        newLineNo: newStart + i + 1,
      });
    }

    // Context after
    const contextEnd = Math.min(
      oldLines.length,
      oldStart + oldCount + CONTEXT_LINES
    );
    for (let i = oldStart + oldCount; i < contextEnd; i++) {
      lines.push({
        type: 'context',
        content: oldLines[i],
        oldLineNo: i + 1,
        newLineNo: newStart + newCount + (i - oldStart - oldCount) + 1,
      });
    }

    // Try to merge with previous hunk if they overlap
    const prev = hunks[hunks.length - 1];
    if (
      prev &&
      contextStart <= prev.oldStart + prev.oldCount - 1 + CONTEXT_LINES
    ) {
      // Merge: extend previous hunk
      // Remove overlapping context from new hunk
      const overlapEnd = prev.oldStart + prev.oldCount - 1 + CONTEXT_LINES;
      const filteredLines = lines.filter((l) => {
        if (l.type !== 'context' || l.oldLineNo === undefined) return true;
        return l.oldLineNo > overlapEnd;
      });
      prev.lines.push(...filteredLines);
      prev.oldCount =
        oldStart +
        oldCount +
        Math.min(CONTEXT_LINES, oldLines.length - oldStart - oldCount) -
        prev.oldStart;
      prev.newCount =
        newStart +
        newCount +
        Math.min(CONTEXT_LINES, newLines.length - newStart - newCount) -
        prev.newStart;
    } else {
      hunks.push({
        oldStart: contextStart + 1, // 1-indexed
        oldCount: lines.filter((l) => l.type !== 'add').length,
        newStart: Math.max(1, newStart - (oldStart - contextStart) + 1),
        newCount: lines.filter((l) => l.type !== 'remove').length,
        lines,
      });
    }
  }

  return hunks;
}

/**
 * Format hunks into colored terminal output.
 */
function formatHunks(
  hunks: Hunk[],
  fileName: string,
  options: RenderDiffOptions
): string {
  const output: string[] = [];

  output.push(`  ${pc.bold(fileName)}`);
  output.push(`  ${pc.dim('─'.repeat(Math.min(fileName.length + 4, 60)))}`);

  for (const hunk of hunks) {
    const header = `@@ -${hunk.oldStart},${hunk.oldCount} +${hunk.newStart},${hunk.newCount} @@`;
    output.push(`  ${pc.cyan(header)}`);

    let lineCount = 0;
    for (const line of hunk.lines) {
      if (options.maxLines && lineCount >= options.maxLines) {
        output.push(
          `  ${pc.dim(`  ... ${hunk.lines.length - lineCount} more lines`)}`
        );
        break;
      }

      switch (line.type) {
        case 'context':
          output.push(`  ${pc.dim('  ' + line.content)}`);
          break;
        case 'remove':
          output.push(`  ${pc.red('- ' + line.content)}`);
          break;
        case 'add':
          output.push(`  ${pc.green('+ ' + line.content)}`);
          break;
      }
      lineCount++;
    }
  }

  output.push('');
  return output.join('\n');
}
