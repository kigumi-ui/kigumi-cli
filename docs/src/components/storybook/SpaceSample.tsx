import './samples.css';

export type SpaceSampleProps = {
  /** CSS custom property name, e.g. "--wa-space-m" */
  token: string;
};

export function SpaceSample({ token }: SpaceSampleProps) {
  return (
    <div className="space-sample">
      <div
        className="space-sample__bar"
        style={{
          width: `var(${token})`,
          height: '1rem',
          background: 'var(--wa-color-brand)',
        }}
      />
    </div>
  );
}
