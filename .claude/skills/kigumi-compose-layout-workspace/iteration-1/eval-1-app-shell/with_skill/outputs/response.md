# App Shell: Sidebar Navigation + Main Content

## Layout Diagram

```
+---sidebar (240px)---+--------main (flex: 1)--------+
|  [Logo]             |                               |
|  --------           |                               |
|  Nav 1 (active)     |    Page Content               |
|  Nav 2              |    (children / Outlet)        |
|  Nav 3              |                               |
|  Nav 4              |                               |
|                     |                               |
|  ...spacer...       |                               |
|                     |                               |
|  --------           |                               |
|  [Avatar] User Name |                               |
+---------------------+-------------------------------+
```

## Install Missing Components

Avatar is not currently installed. Run these commands before using the code below:

**React (kigumi-react):**

```bash
cd /Users/giregar/Documents/dev/git/kigumi-react
npx kigumi add avatar
```

**Vue (kigumi-vue):**

```bash
cd /Users/giregar/Documents/dev/git/kigumi-vue
npx kigumi add avatar
```

Already installed and used: `Button`, `Divider`, `Icon`, `Avatar` (after install).

## React Component

```tsx
import { useState } from 'react';
import { Avatar, Button, Divider, Icon } from '@/components/ui';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface AppShellProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  userName?: string;
  userInitials?: string;
  userImage?: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'house' },
  { id: 'projects', label: 'Projects', icon: 'folder' },
  { id: 'team', label: 'Team', icon: 'users' },
  { id: 'settings', label: 'Settings', icon: 'gear' },
];

export function AppShell({
  children,
  currentPage,
  onNavigate,
  userName = 'Jane Doe',
  userInitials = 'JD',
  userImage,
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
        className="wa-stack wa-gap-0"
        style={{
          backgroundColor: 'var(--wa-color-surface-lowered)',
          transition: 'var(--wa-transition-fast)',
          overflow: 'hidden',
        }}
        aria-label="Main navigation"
      >
        {/* Logo area */}
        <div
          className="wa-split wa-align-items-center"
          style={{ padding: 'var(--wa-space-m)' }}
        >
          {sidebarOpen && <strong className="wa-heading-s">My App</strong>}
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

        <Divider />

        {/* Navigation links */}
        <div
          className="wa-stack wa-gap-xs"
          style={{
            padding: sidebarOpen ? 'var(--wa-space-m)' : 'var(--wa-space-s)',
            flex: 1,
          }}
        >
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentPage === item.id ? 'brand' : 'neutral'}
              appearance="plain"
              onClick={() => onNavigate(item.id)}
              style={{ justifyContent: 'flex-start' }}
            >
              <Icon slot="start" name={item.icon} />
              {sidebarOpen && item.label}
            </Button>
          ))}
        </div>

        {/* User avatar area */}
        <Divider />
        <div
          className="wa-cluster wa-gap-s wa-align-items-center"
          style={{
            padding: sidebarOpen ? 'var(--wa-space-m)' : 'var(--wa-space-s)',
          }}
        >
          <Avatar
            image={userImage}
            initials={userInitials}
            shape="circle"
            style={{ flexShrink: 0 }}
          />
          {sidebarOpen && (
            <span
              className="wa-body-s"
              style={{ flex: 1, minWidth: 0, margin: 0 }}
            >
              {userName}
            </span>
          )}
        </div>
      </nav>

      {/* Main content area */}
      {/* Replace {children} with <Outlet /> when using react-router */}
      <main
        className="wa-stack wa-gap-l"
        style={{ padding: 'var(--wa-space-l)', flex: 1 }}
      >
        {children}
      </main>
    </div>
  );
}
```

## Vue Component

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Avatar, Button, Divider, Icon } from '@/components/ui';

defineProps<{
  currentPage: string;
  userName?: string;
  userInitials?: string;
  userImage?: string;
}>();

const emit = defineEmits<{ navigate: [page: string] }>();

const sidebarOpen = ref(true);

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'house' },
  { id: 'projects', label: 'Projects', icon: 'folder' },
  { id: 'team', label: 'Team', icon: 'users' },
  { id: 'settings', label: 'Settings', icon: 'gear' },
];
</script>

<template>
  <div
    class="wa-flank wa-align-items-stretch wa-gap-0"
    :style="{
      minHeight: '100vh',
      '--flank-size': sidebarOpen ? '240px' : '56px',
    }"
  >
    <!-- Sidebar navigation -->
    <nav
      class="wa-stack wa-gap-0"
      :style="{
        backgroundColor: 'var(--wa-color-surface-lowered)',
        transition: 'var(--wa-transition-fast)',
        overflow: 'hidden',
      }"
      aria-label="Main navigation"
    >
      <!-- Logo area -->
      <div
        class="wa-split wa-align-items-center"
        style="padding: var(--wa-space-m)"
      >
        <strong v-if="sidebarOpen" class="wa-heading-s">My App</strong>
        <Button
          variant="neutral"
          appearance="plain"
          size="small"
          :aria-label="sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'"
          @click="sidebarOpen = !sidebarOpen"
        >
          <Icon :name="sidebarOpen ? 'chevron-left' : 'chevron-right'" />
        </Button>
      </div>

      <Divider />

      <!-- Navigation links -->
      <div
        class="wa-stack wa-gap-xs"
        :style="{
          padding: sidebarOpen ? 'var(--wa-space-m)' : 'var(--wa-space-s)',
          flex: 1,
        }"
      >
        <Button
          v-for="item in navItems"
          :key="item.id"
          :variant="currentPage === item.id ? 'brand' : 'neutral'"
          appearance="plain"
          style="justify-content: flex-start"
          @click="emit('navigate', item.id)"
        >
          <Icon slot="start" :name="item.icon" />
          <span v-if="sidebarOpen">{{ item.label }}</span>
        </Button>
      </div>

      <!-- User avatar area -->
      <Divider />
      <div
        class="wa-cluster wa-gap-s wa-align-items-center"
        :style="{
          padding: sidebarOpen ? 'var(--wa-space-m)' : 'var(--wa-space-s)',
        }"
      >
        <Avatar
          :image="userImage"
          :initials="userInitials ?? 'JD'"
          shape="circle"
          style="flex-shrink: 0"
        />
        <span
          v-if="sidebarOpen"
          class="wa-body-s"
          style="flex: 1; min-width: 0; margin: 0"
        >
          {{ userName ?? 'Jane Doe' }}
        </span>
      </div>
    </nav>

    <!-- Main content area -->
    <!-- Replace <slot /> with <RouterView /> when using vue-router -->
    <main class="wa-stack wa-gap-l" style="padding: var(--wa-space-l); flex: 1">
      <slot />
    </main>
  </div>
</template>
```

## Responsive Behavior

- **Desktop (wide viewport):** `.wa-flank` places the 240px sidebar on the left; main content fills the remaining space. The sidebar can be collapsed to 56px (icon-only mode) via the toggle button.
- **Narrow viewport:** `.wa-flank` auto-stacks vertically when the main content area would be narrower than `--content-percentage` (default 50%). The sidebar appears above the content. For a mobile hamburger drawer pattern instead of stacking, consider upgrading to Pro tier and using the `Page` component, which provides an automatic mobile drawer.
- **No `@media` queries needed** for the basic layout. The sidebar collapse toggle and `.wa-flank` auto-stacking handle both desktop and responsive behavior.

## Key Patterns Used

| Pattern                             | Implementation                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| Sidebar + main content              | `.wa-flank` with `--flank-size: 240px`                                                |
| Full-height sidebar                 | `.wa-align-items-stretch` on the flank container                                      |
| Logo / nav / avatar vertical layout | `.wa-stack` inside `<nav>` with `flex: 1` on the nav section to push avatar to bottom |
| Active nav item                     | `variant="brand"` vs `variant="neutral"` on Button                                    |
| Collapse toggle                     | `--flank-size` switches between `240px` and `56px`                                    |
| Avatar + name inline                | `.wa-cluster` with `flex: 1; min-width: 0` on the text element                        |
| Semantic HTML                       | `<nav aria-label>` for sidebar, `<main>` for content                                  |
| Icon + text alignment               | `slot="start"` on Icon inside Button                                                  |
