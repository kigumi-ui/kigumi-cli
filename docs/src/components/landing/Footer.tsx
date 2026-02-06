export const Footer = () => {
  return (
    <section slot="footer" className="wa-grid">
      <div className="wa-stack wa-gap-xl">
        <wa-divider></wa-divider>
        <span className="wa-stack wa-gap-2xs wa-align-items-start">
          <p style={{ textAlign: 'right' }}>
            Kigumi is built by{' '}
            <a
              href="https://mischa.dev"
              target="_blank"
              rel="noopener noreferrer"
            >
              Michael Suzuki
            </a>
          </p>
          <p style={{ textAlign: 'right' }}>
            <a
              href="https://webawesome.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Web Awesome
            </a>{' '}
            is made by{' '}
            <a
              href="https://fontawesome.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Font Awesome
            </a>
          </p>
        </span>
      </div>
    </section>
  );
};
