import './samples.css';

export type MotionSampleProps = {
  /** CSS custom property name for the transition duration, e.g. "--wa-transition-normal" */
  token: string;
  /** Override the easing function. Default: reads --wa-transition-easing */
  easing?: string;
};

export function MotionSample({ token, easing }: MotionSampleProps) {
  const easingValue = easing || 'linear';

  return (
    <div className="motion-sample">
      <div
        className="motion-sample__box"
        style={{
          width: '4rem',
          height: '4rem',
          background: 'var(--wa-color-brand)',
          transition: `border-radius var(${token}) ${easingValue}`,
        }}
      />
    </div>
  );
}
