import { Icon } from '../ui';

export const Footer = () => {
  return (
    <section slot="footer" className="wa-justify-content-center">
      <div className="wa-stack">
        <div className="wa-span-grid wa-gap-xs wa-justify-content-center wa-align-items-center">
          <span>
            Kigumi by{' '}
            <a
              href="https://mischa.dev"
              target="_blank"
              rel="noopener noreferrer"
            >
              Michael Suzuki
            </a>
          </span>
          <Icon name="heart" />
          <span>
            <a
              href="https://webawesome.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Web Awesome
            </a>{' '}
            by{' '}
            <a
              href="https://fontawesome.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Font Awesome
            </a>
          </span>
        </div>
        <p className="wa-caption-m" style={{ textAlign: 'center' }}>
          Kigumi was created because because I am a big fan of Web Awesome and
          see it as the right library to make the web truly cross-platform.
        </p>
      </div>
    </section>
  );
};
