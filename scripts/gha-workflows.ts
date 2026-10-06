/**
 * The workflow files the GitHub Actions validators inspect, and the rule for
 * when an inspection verified nothing.
 *
 * Shared by validate-gha-permissions.ts and validate-gha-issue-writes.ts, so
 * both read the same files the same way and neither can pass on an empty
 * directory (docs/adr/0003).
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'yaml';

const PROJECT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const WORKFLOW_DIR = path.join(PROJECT_ROOT, '.github', 'workflows');

export interface WorkflowFile {
  /** File name inside the workflow directory, e.g. `ci.yml`. */
  file: string;
  /** The parsed YAML document. */
  doc: unknown;
}

/**
 * Every `.yml` / `.yaml` file in `dir`, parsed, in file-name order. An absent
 * directory yields an empty list; the caller turns that into a did-not-run
 * outcome with `inspectionGap`.
 */
export function readWorkflowFiles(dir: string = WORKFLOW_DIR): WorkflowFile[] {
  if (!fs.pathExistsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    .sort()
    .map((file) => ({
      file,
      doc: parse(fs.readFileSync(path.join(dir, file), 'utf8')) as unknown,
    }));
}

/**
 * Why a validator's run verified nothing, or null when it inspected at least
 * one item. `what` names the items, e.g. "checkout job".
 *
 * An empty inspection must not read as a clean one: a missing directory, or a
 * matcher that stopped matching, would otherwise print the same pass as a
 * correct repo.
 */
export function inspectionGap(
  workflowsRead: number,
  inspected: number,
  what: string
): string | null {
  if (workflowsRead === 0) return 'no workflow file found in .github/workflows';
  if (inspected === 0) {
    return `read ${workflowsRead} workflow file(s) but found no ${what} to inspect`;
  }
  return null;
}
