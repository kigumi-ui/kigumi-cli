# App Shell with Sidebar Navigation

## Install Required Components

```bash
npx kigumi add avatar
npx kigumi add icon
npx kigumi add divider
npx kigumi add badge
npx kigumi add tooltip
```

## Component: `AppShell.tsx`

```tsx
import { Avatar, Icon, Divider, Badge, Tooltip } from '@/components/ui';

const navItems = [
  { label: 'Dashboard', icon: 'house', href: '/', active: true },
  { label: 'Projects', icon: 'folder', href: '/projects' },
  { label: 'Tasks', icon: 'list-check', href: '/tasks', badge: 3 },
  { label: 'Messages', icon: 'envelope', href: '/messages', badge: 12 },
  { label: 'Analytics', icon: 'chart-line', href: '/analytics' },
  { label: 'Settings', icon: 'gear', href: '/settings' },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="app-shell__sidebar">
        <div className="wa-stack" style={{ height: '100%' }}>
          {/* Logo area */}
          <div className="app-shell__logo">
            <div className="wa-cluster wa-gap-s wa-align-items-center">
              <Icon
                name="hexagon-image"
                style={{
                  fontSize: '1.5rem',
                  color: 'var(--wa-color-brand-60)',
                }}
              />
              <span className="wa-heading-xs">Acme App</span>
            </div>
          </div>

          <Divider />

          {/* Navigation links */}
          <nav className="app-shell__nav">
            <div className="wa-stack wa-gap-2xs">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`app-shell__nav-item ${item.active ? 'app-shell__nav-item--active' : ''}`}
                >
                  <div
                    className="wa-cluster wa-gap-s wa-align-items-center"
                    style={{ flex: 1 }}
                  >
                    <Icon name={item.icon} style={{ fontSize: '1.125rem' }} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="brand" pill>
                      {item.badge}
                    </Badge>
                  )}
                </a>
              ))}
            </div>
          </nav>

          {/* Spacer pushes user section to bottom */}
          <div style={{ flex: 1 }} />

          <Divider />

          {/* User section at bottom */}
          <div className="app-shell__user">
            <div className="wa-cluster wa-gap-s wa-align-items-center">
              <Avatar
                image="https://i.pravatar.cc/48?img=3"
                label="Jane Doe"
                shape="circle"
              />
              <div
                className="wa-stack wa-gap-0"
                style={{ flex: 1, minWidth: 0 }}
              >
                <span className="wa-body-s" style={{ fontWeight: 600 }}>
                  Jane Doe
                </span>
                <span
                  className="wa-caption-s"
                  style={{
                    color: 'var(--wa-color-neutral-60)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  jane@acme.com
                </span>
              </div>
              <Tooltip content="Log out" placement="top">
                <button className="app-shell__icon-button" aria-label="Log out">
                  <Icon
                    name="arrow-right-from-bracket"
                    style={{
                      fontSize: '1rem',
                      color: 'var(--wa-color-neutral-60)',
                    }}
                  />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="app-shell__main">{children}</main>
    </div>
  );
}
```

## Styles: `AppShell.css`

```css
.app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ---- Sidebar ---- */
.app-shell__sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--wa-color-neutral-5);
  border-right: 1px solid var(--wa-color-neutral-20);
  padding: var(--wa-space-m);
  overflow-y: auto;
}

.app-shell__logo {
  padding: var(--wa-space-xs) 0;
}

/* ---- Navigation ---- */
.app-shell__nav {
  padding: var(--wa-space-xs) 0;
}

.app-shell__nav-item {
  display: flex;
  align-items: center;
  gap: var(--wa-space-s);
  padding: var(--wa-space-xs) var(--wa-space-s);
  border-radius: var(--wa-border-radius-m);
  color: var(--wa-color-neutral-70);
  text-decoration: none;
  font: var(--wa-body-s);
  transition:
    background-color 150ms ease,
    color 150ms ease;
}

.app-shell__nav-item:hover {
  background: var(--wa-color-neutral-10);
  color: var(--wa-color-neutral-90);
}

.app-shell__nav-item--active {
  background: var(--wa-color-brand-10);
  color: var(--wa-color-brand-60);
  font-weight: 600;
}

.app-shell__nav-item--active:hover {
  background: var(--wa-color-brand-10);
  color: var(--wa-color-brand-60);
}

/* ---- User section ---- */
.app-shell__user {
  padding: var(--wa-space-xs) 0;
}

.app-shell__icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: var(--wa-border-radius-m);
  background: transparent;
  cursor: pointer;
  transition: background-color 150ms ease;
}

.app-shell__icon-button:hover {
  background: var(--wa-color-neutral-10);
}

/* ---- Main content ---- */
.app-shell__main {
  flex: 1;
  overflow-y: auto;
  padding: var(--wa-space-xl);
  background: var(--wa-color-neutral-0);
}
```

## Usage

```tsx
import { AppShell } from '@/components/examples/AppShell';

function App() {
  return (
    <AppShell>
      <h1 className="wa-heading-l">Dashboard</h1>
      <p className="wa-body-m" style={{ color: 'var(--wa-color-neutral-60)' }}>
        Welcome back, Jane. Here is what is happening today.
      </p>
      {/* Page content goes here */}
    </AppShell>
  );
}
```

## Key decisions

- **Layout approach**: Uses a simple CSS `display: flex` on the root `.app-shell` container for the sidebar + main split. The sidebar is fixed at `240px` via `flex-shrink: 0`. This is more explicit and reliable for an app shell than the `.wa-flank` utility, which is designed for content-level sidebar layouts and uses CSS Grid intrinsic sizing.
- **Sidebar structure**: Uses `.wa-stack` with `height: 100%` to create a vertical layout. A `flex: 1` spacer div pushes the user avatar section to the bottom.
- **Navigation items**: Each link uses `.wa-cluster` for horizontal alignment of icon + label + optional badge. Active state is indicated with a brand-colored background.
- **User section**: Combines `Avatar` (with `image`, `label`, and `shape="circle"`) with text info and a logout icon button wrapped in a `Tooltip`.
- **Component imports**: All from `@/components/ui` (Avatar, Icon, Divider, Badge, Tooltip). Uses `class` on Kigumi wrapper components and `className` on HTML elements.
- **Accessibility**: Avatar has a `label` prop, the logout button has `aria-label`, and navigation links are native `<a>` elements for keyboard navigation.
- **No `!important`**: All styling uses standard CSS specificity and cascade.
- **Token-based values**: All colors, spacing, and typography reference `--wa-*` CSS custom properties for theme consistency.
