import { Card, Icon, Tooltip } from '@/components/ui';
import { HeroPreview } from '@/components/landing/HeroPreview';
import reactLogo from '@/assets/react-logo.svg';
import vueLogo from '@/assets/vuejs-logo.svg';
import angularLogo from '@/assets/angular-logo.svg';
import svelteLogo from '@/assets/svelte-logo.svg';
import vitejsLogo from '@/assets/vitejs-logo.svg';

const frameworks = [
  { id: 'vitejs', src: vitejsLogo, alt: 'Vite', available: true },
  { id: 'react', src: reactLogo, alt: 'React', available: true },
  { id: 'vue', src: vueLogo, alt: 'Vue', available: true },
  { id: 'angular', src: angularLogo, alt: 'Angular', available: true },
  { id: 'svelte', src: svelteLogo, alt: 'Svelte', available: false },
] as const;

const starters = [
  {
    title: 'React Starter',
    description: 'React + Vite + Kigumi',
    href: 'https://github.com/kigumi-ui/kigumi-react-starter',
    icon: 'react',
    iconFamily: 'brands',
  },
  {
    title: 'Vue Starter',
    description: 'Vue + Vite + Kigumi',
    href: 'https://github.com/kigumi-ui/kigumi-vue-starter',
    icon: 'vuejs',
    iconFamily: 'brands',
  },
  {
    title: 'Angular Starter',
    description: 'Angular + Kigumi',
    href: 'https://github.com/kigumi-ui/kigumi-angular-starter',
    icon: 'angular',
    iconFamily: 'brands',
  },
] as const;

export function Ecosystem() {
  return (
    <section className="ecosystem section">
      <div className="wa-stack wa-gap-xl">
        <div className="wa-stack wa-gap-xs">
          <h2 className="wa-heading-2xl">Works with your stack</h2>
          <p className="wa-color-text-quiet">
            Compatible with Node 20+ and modern frontend tooling:
          </p>
          <div className="ecosystem__logos wa-cluster wa-gap-m wa-align-items-center">
            {frameworks.map((fw) => (
              <span key={fw.id}>
                {!fw.available && (
                  <Tooltip for={`${fw.id}-logo`}>Coming soon</Tooltip>
                )}
                <img
                  id={`${fw.id}-logo`}
                  src={fw.src}
                  alt={fw.alt}
                  className="ecosystem__logo"
                  style={
                    !fw.available
                      ? { filter: 'grayscale(1)', opacity: 0.5 }
                      : undefined
                  }
                />
              </span>
            ))}
          </div>
        </div>

        <div className="wa-grid wa-align-items-start wa-gap-4xl">
          <div className="ecosystem__info wa-stack wa-gap-xl">
            <div className="wa-stack wa-gap-s">
              <div className="wa-stack wa-gap-2xs">
                <h3 className="wa-heading-l">Starter Templates</h3>
                <p className="wa-color-text-quiet">
                  Get started with a pre-configured project template
                </p>
              </div>
              <div className="ecosystem__starters">
                {starters.map((starter) => (
                  <a
                    key={starter.title}
                    href={starter.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <Card
                      appearance="outlined"
                      className="ecosystem__starter-card"
                    >
                      <div className="wa-cluster wa-gap-s wa-align-items-center">
                        <Icon
                          name={starter.icon}
                          family={starter.iconFamily}
                          style={{ fontSize: 'var(--wa-font-size-xl)' }}
                        />
                        <div className="wa-stack wa-gap-2xs">
                          <span className="wa-heading-s">{starter.title}</span>
                          <span className="wa-caption-xs wa-color-text-quiet">
                            {starter.description}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </a>
                ))}
              </div>
            </div>

            <div className="wa-stack wa-gap-s">
              <div className="wa-stack wa-gap-2xs">
                <h3 className="wa-heading-l">Extensions</h3>
                <p className="wa-color-text-quiet">
                  Extensions for Cursor and VSCode to help you use Kigumi
                </p>
              </div>
              <p className="wa-color-text-quiet">
                <a
                  href="https://marketplace.visualstudio.com/items?itemName=Kigumi.kigumi-intellisense"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Card
                    appearance="outlined"
                    className="ecosystem__starter-card"
                  >
                    <div className="wa-cluster wa-gap-s wa-align-items-center">
                      <Icon
                        name="code"
                        family="solid"
                        style={{ fontSize: 'var(--wa-font-size-xl)' }}
                      />
                      <div className="wa-stack wa-gap-2xs">
                        <span className="wa-heading-s">
                          Kigumi IntelliSense
                        </span>
                        <span className="wa-caption-xs wa-color-text-quiet">
                          IntelliSense for Kigumi components
                        </span>
                      </div>
                    </div>
                  </Card>
                </a>
              </p>
            </div>
            <div className="wa-stack wa-gap-s">
              <div className="wa-stack wa-gap-2xs">
                <h3 className="wa-heading-l">Agent skills</h3>
                <p className="wa-color-text-quiet">
                  Instantly teach your agent how to use Kigumi
                </p>
              </div>
              <p className="wa-color-text-quiet">
                <Card appearance="outlined" style={{ '--spacing': '0' }}>
                  <div
                    className="wa-flank:end wa-align-items-center wa-gap-xs"
                    style={{ position: 'relative', overflow: 'auto' }}
                  >
                    <pre>
                      <code>
                        <span
                          style={{
                            opacity: 0.6,
                            pointerEvents: 'none',
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: 'inherit',
                            zIndex: 1,
                            userSelect: 'none',
                          }}
                          aria-hidden="true"
                        >
                          ${' '}
                        </span>
                        <span
                          style={{
                            paddingLeft: 'var(--wa-space-m)',
                            display: 'inline-block',
                          }}
                        >
                          npx skills add https://kigumi.style/skills/kigumi
                        </span>
                      </code>
                    </pre>
                  </div>
                </Card>
              </p>
            </div>
          </div>

          <div className="ecosystem__preview">
            <HeroPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
