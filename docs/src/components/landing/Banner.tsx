export const Banner = () => {
  return (
    <div
      slot="banner"
      style={{
        position: 'relative',
        padding: 'var(--wa-space-s)',
        background:
          'radial-gradient(circle at center, var(--wa-color-brand-fill-quiet), var(--wa-color-brand-fill-normal))',
      }}
    >
      Coming soon.
    </div>
  );
};
