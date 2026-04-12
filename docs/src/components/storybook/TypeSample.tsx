import type { ReactNode, CSSProperties } from 'react';

export type TypeSampleProps = {
  /** Optional CSS custom property for font-family */
  family?: string;
  /** Optional CSS custom property for font-size */
  size?: string;
  /** Optional CSS custom property for font-weight */
  weight?: string;
  /** Optional CSS custom property for line-height */
  lineHeight?: string;
  children: ReactNode;
};

export function TypeSample({
  family,
  size,
  weight,
  lineHeight,
  children,
}: TypeSampleProps) {
  const style: CSSProperties = {};
  if (family) style.fontFamily = `var(${family})`;
  if (size) style.fontSize = `var(${size})`;
  if (weight) style.fontWeight = `var(${weight})`;
  if (lineHeight) style.lineHeight = `var(${lineHeight})`;

  const hasStyle = Object.keys(style).length > 0;

  return (
    <span className="type-sample" style={hasStyle ? style : undefined}>
      {children}
    </span>
  );
}
