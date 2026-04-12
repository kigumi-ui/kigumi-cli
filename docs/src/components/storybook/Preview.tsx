import type { ReactNode } from 'react';
import './preview.css';

export type PreviewProps = {
  /** The visual sample to display inside the container */
  children: ReactNode;
  /** Optional small uppercase caption rendered above the content */
  label?: string;
  /** Background tone. "default" uses the raised surface, "muted" uses the lowered surface. Default: "default" */
  tone?: 'default' | 'muted';
  /** Inner padding step. Default: "l" */
  pad?: 's' | 'm' | 'l';
};

export function Preview({
  children,
  label,
  tone = 'default',
  pad = 'l',
}: PreviewProps) {
  return (
    <figure className={`preview preview--tone-${tone} preview--pad-${pad}`}>
      {label && <figcaption className="preview__label">{label}</figcaption>}
      <div className="preview__content">{children}</div>
    </figure>
  );
}
