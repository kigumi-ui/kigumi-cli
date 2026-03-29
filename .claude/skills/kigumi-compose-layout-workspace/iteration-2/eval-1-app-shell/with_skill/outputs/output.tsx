/**
 * App Shell Layout
 *
 * Sidebar navigation (240px) + main content area.
 * Sidebar: logo at top, navigation links in middle, user avatar at bottom.
 *
 * Install: npx kigumi add avatar button divider icon
 *
 * ASCII layout:
 * +--sidebar (240px)--+--------main---------+
 * |  [Logo]           |                     |
 * |  ─────────        |    Page Content     |
 * |  Nav Link 1       |                     |
 * |  Nav Link 2       |                     |
 * |  Nav Link 3       |                     |
 * |                   |                     |
 * |  ─────────        |                     |
 * |  [Avatar] User    |                     |
 * +-------------------+---------------------+
 *
 * Responsive: .wa-flank stacks vertically on narrow screens
 * when main content would be narrower than --content-percentage.
 */

import { useState } from 'react';
import { Avatar, Button, Divider, Icon } from '@/components/ui';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface AppShellProps {
  children: React.ReactNode;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'chart-line' },
  { id: 'projects', label: 'Projects', icon: 'folder' },
  { id: 'messages', label: 'Messages', icon: 'envelope' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'settings', label: 'Settings', icon: 'gear' },
];

export function AppShell({
  children,
  currentPage = 'dashboard',
  onNavigate,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div
      className="wa-flank wa-align-items-stretch wa-gap-0"
      style={
        {
          minHeight: '100vh',
          '--flank-size': sidebarOpen ? '240px' : '56px',
        } as React.CSSProperties
      }
    >
      {/* Sidebar navigation */}
      <nav
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: sidebarOpen ? 'var(--wa-space-m)' : 'var(--wa-space-s)',
          backgroundColor: 'var(--wa-color-surface-lowered)',
          borderRight: '1px solid var(--wa-color-surface-border)',
          transition: 'var(--wa-transition-fast)',
          overflow: 'hidden',
        }}
        aria-label="Main navigation"
      >
        {/* Top: Logo + collapse toggle */}
        <div className="wa-split wa-align-items-center">
          {sidebarOpen && (
            <strong className="wa-heading-s">My App</strong>
          )}
          <Button
            variant="neutral"
            appearance="plain"
            size="small"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Icon name={sidebarOpen ? 'chevron-left' : 'chevron-right'} />
          </Button>
        </div>

        <Divider style={{ margin: 'var(--wa-space-s) 0' }} />

        {/* Middle: Navigation links */}
        <div className="wa-stack wa-gap-xs" style={{ flex: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentPage === item.id ? 'brand' : 'neutral'}
              appearance="plain"
              onClick={() => onNavigate?.(item.id)}
              style={{ justifyContent: 'flex-start' }}
            >
              <Icon slot="start" name={item.icon} />
              {sidebarOpen && item.label}
            </Button>
          ))}
        </div>

        <Divider style={{ margin: 'var(--wa-space-s) 0' }} />

        {/* Bottom: User avatar */}
        <div
          className="wa-cluster wa-gap-s wa-align-items-center"
          style={{ padding: 'var(--wa-space-xs) 0' }}
        >
          <Avatar
            initials="JD"
            label="Jane Doe"
            shape="circle"
            style={{ '--size': '2rem', flexShrink: 0 } as React.CSSProperties}
          />
          {sidebarOpen && (
            <span
              className="wa-body-s"
              style={{ flex: 1, minWidth: 0, margin: 0 }}
            >
              Jane Doe
            </span>
          )}
        </div>
      </nav>

      {/* Main content area */}
      {/* Use react-router's Outlet for routing:
          import { Outlet } from 'react-router-dom';
          Replace the <main> children with <Outlet /> */}
      <main
        className="wa-stack wa-gap-l"
        style={{ padding: 'var(--wa-space-l)', flex: 1 }}
      >
        {/* <Outlet /> -- uncomment when using react-router */}
        {children}
      </main>
    </div>
  );
}

/**
 * Responsive behavior:
 * - Desktop (>~600px): 240px sidebar + fluid main content side by side
 * - Collapsed: 56px icon-only sidebar + wider main content
 * - Narrow screens: .wa-flank auto-stacks when main content would be
 *   narrower than --content-percentage (default 50%)
 *
 * The sidebar uses flex column layout with flex:1 on the nav section
 * to push the avatar to the bottom. No @media queries needed.
 */
