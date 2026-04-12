import './samples.css';

export type ShadowSampleProps = {
  /** CSS custom property name, e.g. "--wa-shadow-m" */
  token: string;
};

export function ShadowSample({ token }: ShadowSampleProps) {
  return (
    <div className="shadow-sample">
      <div
        className="shadow-sample__box"
        style={{
          width: '4rem',
          height: '4rem',
          background: 'var(--wa-color-surface-raised)',
          border: '1px solid var(--wa-color-surface-border)',
          boxShadow: `var(${token})`,
        }}
      />
    </div>
  );
}
