import { Icon } from '../ui';

export const Banner = () => {
  return (
    <div
      slot="banner"
      className="wa-cluster wa-gap-xs wa-justify-content-center"
      style={{
        position: 'relative',
        padding: 'var(--wa-space-s)',
        background:
          'radial-gradient(circle at center, var(--wa-color-neutral-fill-quiet), var(--wa-color-neutral-fill-normal))',
      }}
    >
      <Icon name="info-circle" slot="start" /> React and Vue support is now in
      beta.
    </div>
  );
};
