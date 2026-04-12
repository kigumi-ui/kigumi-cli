import './samples.css';

export type RadiusSampleProps = {
  /** CSS custom property name, e.g. "--wa-border-radius-m" */
  token: string;
};

export function RadiusSample({ token }: RadiusSampleProps) {
  return (
    <div className="radius-sample">
      <div
        className="radius-sample__box"
        style={{
          width: '4rem',
          height: '4rem',
          background: 'var(--wa-color-brand)',
          borderRadius: `var(${token})`,
        }}
      />
    </div>
  );
}
