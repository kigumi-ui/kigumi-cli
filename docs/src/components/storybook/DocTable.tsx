import type { ReactNode } from 'react';
import { Unstyled } from '@storybook/addon-docs/blocks';
import './doc-table.css';

type DocPageProps = {
  title: string;
  description: ReactNode;
  children: ReactNode;
};

export function DocPage({ title, description, children }: DocPageProps) {
  return (
    <Unstyled>
      <div className="doc-page">
        <h1 className="wa-heading-2xl doc-page__title">{title}</h1>
        <p className="doc-page__description">{description}</p>
        {children}
      </div>
    </Unstyled>
  );
}

type DocSectionProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
};

export function DocSection({ title, description, children }: DocSectionProps) {
  return (
    <>
      <h2 className="wa-heading-xl doc-section__title">{title}</h2>
      {description && <p className="doc-section__description">{description}</p>}
      {children}
    </>
  );
}

type DocColumn<T> = {
  key: keyof T & string;
  header: string;
};

type DocTableProps<T extends Record<string, ReactNode>> = {
  columns: DocColumn<T>[];
  rows: T[];
};

export function DocTable<T extends Record<string, ReactNode>>({
  columns,
  rows,
}: DocTableProps<T>) {
  return (
    <table className="doc-table">
      <thead>
        <tr className="doc-table__header-row">
          {columns.map((col) => (
            <th key={col.key} className="doc-table__th">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx} className="doc-table__row">
            {columns.map((col) => (
              <td key={col.key} className="doc-table__td">
                {row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
