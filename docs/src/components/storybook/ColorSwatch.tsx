import './samples.css';

export type ColorSwatchProps = {
  /** CSS custom property name (without var()), e.g. "--wa-color-brand-fill-loud" */
  token: string;
  /** Optional label rendered below the swatch */
  label?: string;
};

export function ColorSwatch({ token, label }: ColorSwatchProps) {
  return (
    <div className="color-swatch">
      <div
        className="color-swatch__box"
        style={{
          background: `var(${token})`,
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: 'var(--wa-border-radius-m)',
          border:
            'var(--wa-border-width-s) solid var(--wa-color-surface-border)',
        }}
      />
      {label && <span className="color-swatch__label">{label}</span>}
    </div>
  );
}
