import { Icon, Divider } from '@/components/ui';

interface NavItem {
  icon: string;
  label: string;
  href: string;
  active?: boolean;
}

const navItems: NavItem[] = [
  { icon: 'house', label: 'Dashboard', href: '#', active: true },
  { icon: 'chart-bar', label: 'Analytics', href: '#' },
  { icon: 'users', label: 'Users', href: '#' },
  { icon: 'folder', label: 'Projects', href: '#' },
  { icon: 'gear', label: 'Settings', href: '#' },
];

export function AppShell({ children }: { children?: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: '240px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--wa-color-neutral-0)',
          borderRight: '1px solid var(--wa-color-neutral-20)',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: 'var(--wa-spacing-l)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--wa-spacing-s)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--wa-border-radius-m)',
              backgroundColor: 'var(--wa-color-brand-60)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon
              name="bolt"
              style={{ color: 'var(--wa-color-neutral-0)', fontSize: '16px' }}
            />
          </div>
          <span
            style={{
              fontWeight: 'var(--wa-font-weight-semibold)',
              fontSize: 'var(--wa-font-size-m)',
              color: 'var(--wa-color-neutral-100)',
            }}
          >
            Kigumi App
          </span>
        </div>

        <Divider />

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            padding: 'var(--wa-spacing-s)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--wa-spacing-2xs)',
            overflowY: 'auto',
          }}
          aria-label="Main navigation"
        >
          {navItems.map((item) => (
            <a
              key={item.href + item.label}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--wa-spacing-s)',
                padding: 'var(--wa-spacing-s) var(--wa-spacing-m)',
                borderRadius: 'var(--wa-border-radius-m)',
                textDecoration: 'none',
                color: item.active
                  ? 'var(--wa-color-brand-60)'
                  : 'var(--wa-color-neutral-70)',
                backgroundColor: item.active
                  ? 'var(--wa-color-brand-10)'
                  : 'transparent',
                fontWeight: item.active
                  ? 'var(--wa-font-weight-semibold)'
                  : 'var(--wa-font-weight-normal)',
                fontSize: 'var(--wa-font-size-s)',
                transition: 'background-color 0.15s ease, color 0.15s ease',
              }}
              aria-current={item.active ? 'page' : undefined}
            >
              <Icon
                name={item.icon}
                style={{
                  fontSize: '16px',
                  flexShrink: 0,
                  color: item.active
                    ? 'var(--wa-color-brand-60)'
                    : 'var(--wa-color-neutral-60)',
                }}
              />
              {item.label}
            </a>
          ))}
        </nav>

        <Divider />

        {/* User avatar */}
        <div
          style={{
            padding: 'var(--wa-spacing-m)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--wa-spacing-s)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--wa-color-brand-20)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            <Icon
              name="user"
              style={{
                fontSize: '18px',
                color: 'var(--wa-color-brand-70)',
              }}
            />
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <p
              style={{
                margin: 0,
                fontWeight: 'var(--wa-font-weight-semibold)',
                fontSize: 'var(--wa-font-size-s)',
                color: 'var(--wa-color-neutral-100)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Mischa Giregar
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 'var(--wa-font-size-xs)',
                color: 'var(--wa-color-neutral-60)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Design Lead
            </p>
          </div>
          <button
            aria-label="Open user menu"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 'var(--wa-spacing-2xs)',
              borderRadius: 'var(--wa-border-radius-s)',
              color: 'var(--wa-color-neutral-60)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Icon name="ellipsis-vertical" style={{ fontSize: '16px' }} />
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: 'var(--wa-color-neutral-5)',
          padding: 'var(--wa-spacing-xl)',
        }}
      >
        {children ?? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--wa-spacing-m)',
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 'var(--wa-font-size-2xl)',
                fontWeight: 'var(--wa-font-weight-bold)',
                color: 'var(--wa-color-neutral-100)',
              }}
            >
              Dashboard
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 'var(--wa-font-size-m)',
                color: 'var(--wa-color-neutral-60)',
              }}
            >
              Welcome back. Here is what is happening today.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
