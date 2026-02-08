import { useState } from 'react';
import { Icon, Dialog } from '@/components/ui';

export const Footer = () => {
  const [imprintOpen, setImprintOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <>
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
          <div className="footer-legal-links wa-span-grid wa-gap-xs wa-justify-content-center">
            <button
              className="footer-legal-link"
              onClick={() => setImprintOpen(true)}
            >
              Imprint
            </button>
            <span>•</span>
            <button
              className="footer-legal-link"
              onClick={() => setPrivacyOpen(true)}
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </section>

      <Dialog
        open={imprintOpen}
        label="Imprint"
        onHide={() => setImprintOpen(false)}
      >
        <h3 className="wa-heading-m">Information pursuant to § 5 DDG</h3>
        <p className="wa-body-s">
          <ul className="wa-list-plain">
            <li>Michael Suzuki</li>
            <li>c/o flexdienst – #20266</li>
            <li>Kurt-Schumacher-Straße 76</li>
            <li>67663 Kaiserslautern</li>
            <li>Deutschland</li>
          </ul>
        </p>

        <h3 className="wa-heading-m">Contact</h3>
        <p className="wa-body-s">
          Email: <a href="mailto:legal@mischa.dev">legal@mischa.dev</a>
        </p>

        <h3 className="wa-heading-m">
          Responsible for content according to § 55 Abs. 2 RStV
        </h3>
        <p className="wa-body-s">
          Michael Suzuki
          <br />
          c/o flexdienst – #20266
          <br />
          Kurt-Schumacher-Straße 76
          <br />
          67663 Kaiserslautern
          <br />
          Deutschland
        </p>
      </Dialog>

      <Dialog
        open={privacyOpen}
        label="Privacy Policy"
        onHide={() => setPrivacyOpen(false)}
        className="legal-dialog"
      >
        <div>
          <h3 className="wa-heading-m">1. Controller</h3>
          <p className="wa-body-s">
            The controller responsible for data processing on this website is:
          </p>
          <p className="wa-body-s">
            <ul className="wa-list-plain">
              <li>Michael Suzuki</li>
              <li>c/o flexdienst – #20266</li>
              <li>Kurt-Schumacher-Straße 76</li>
              <li>67663 Kaiserslautern</li>
              <li>Deutschland</li>
            </ul>
            E-Mail: <a href="mailto:legal@mischa.dev">legal@mischa.dev</a>
          </p>

          <h3 className="wa-heading-m">2. Hosting and Server Logs</h3>
          <p className="wa-body-s">
            This website is hosted by Vercel Inc., 440 N Barranca Ave #4133,
            Covina, CA 91723, USA. When you access the website, the following
            data is automatically stored in server log files:
          </p>
          <ul className="wa-list-plain">
            <li>IP address (anonymized)</li>
            <li>Date and time of access</li>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Referrer URL (previously visited page)</li>
            <li>Geolocation (city, country, derived from IP)</li>
            <li>Device type and network speed</li>
          </ul>
          <p className="wa-body-s">
            <strong>Legal basis:</strong> Art. 6 (1) lit. f GDPR (legitimate
            interest in the technical provision, security, and stability of the
            website).
          </p>
          <p className="wa-body-s">
            <strong>Storage duration:</strong> Logs are automatically deleted by
            Vercel after a short period. For detailed information, see Vercel
            Privacy Policy.
          </p>
          <p className="wa-body-s">
            <strong>Data transfer to third countries:</strong> Data may be
            stored on servers outside the EU/EEA (e.g., USA). Vercel is
            certified under the EU-U.S. Data Privacy Framework and is
            GDPR-compliant.
          </p>

          <h3 className="wa-heading-m">3. Your Rights</h3>
          <p className="wa-body-s">
            You have the following rights regarding your data:
          </p>
          <ul className="wa-list-plain">
            <li>Right of access (Art. 15 GDPR)</li>
            <li>Right to rectification (Art. 16 GDPR)</li>
            <li>Right to erasure (Art. 17 GDPR)</li>
            <li>Right to restriction of processing (Art. 18 GDPR)</li>
            <li>Right to data portability (Art. 20 GDPR)</li>
            <li>Right to object (Art. 21 GDPR)</li>
            <li>
              Right to lodge a complaint with a supervisory authority (Art. 77
              GDPR)
            </li>
          </ul>
          <p className="wa-body-s">
            Contact for inquiries:{' '}
            <a href="mailto:legal@mischa.dev">legal@mischa.dev</a>
          </p>

          <h3 className="wa-heading-m">4. Cookies</h3>
          <p className="wa-body-s">
            This website does not use cookies or tracking tools.
          </p>
        </div>
      </Dialog>
    </>
  );
};
