import type { ReactNode } from 'react';
import './table.css';

export type TokenRow = {
  /** Full CSS custom property name including the leading `--` */
  name: string;
  /** Resolved or computed value, e.g. "1rem (16px)" */
  value: string;
  /** Optional one-sentence description */
  description?: string;
  /** Optional visual preview node, typically a sample component */
  preview?: ReactNode;
};

export type TokenTableProps = {
  rows: TokenRow[];
  /** When true, renders the Description column. Default: false */
  showDescription?: boolean;
  /** When true, renders the Preview column. Default: auto-detected from rows */
  showPreview?: boolean;
};

export function TokenTable({
  rows,
  showDescription = false,
  showPreview,
}: TokenTableProps) {
  const previewVisible =
    showPreview ?? rows.some((row) => row.preview !== undefined);

  return (
    <table className="docs-table">
      <thead>
        <tr className="docs-table__header-row">
          <th className="docs-table__th">Variable</th>
          <th className="docs-table__th">Value</th>
          {showDescription && <th className="docs-table__th">Description</th>}
          {previewVisible && <th className="docs-table__th">Preview</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name} className="docs-table__row">
            <td className="docs-table__td docs-table__td--name">
              <code>{row.name}</code>
            </td>
            <td className="docs-table__td docs-table__td--value">
              <code>{row.value}</code>
            </td>
            {showDescription && (
              <td className="docs-table__td docs-table__td--description">
                {row.description}
              </td>
            )}
            {previewVisible && (
              <td className="docs-table__td docs-table__td--preview">
                {row.preview}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
