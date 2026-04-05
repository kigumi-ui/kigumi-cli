# Layout Archetypes -- Angular

Angular standalone component versions of all layout archetypes.
Import components from `@/components/ui/{Name}/{kebab-name}.component`.

## A: App Shell

Sidebar navigation + main content area with collapsible sidebar.

**Required components:** `npx kigumi add button divider icon`

```typescript
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { ButtonComponent } from '@/components/ui/Button/button.component';
import { DividerComponent } from '@/components/ui/Divider/divider.component';
import { IconComponent } from '@/components/ui/Icon/icon.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [ButtonComponent, DividerComponent, IconComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div
      class="wa-flank wa-align-items-stretch wa-gap-0"
      [style.min-height]="'100vh'"
      [style.--flank-size]="sidebarOpen ? '240px' : '56px'"
    >
      <nav
        class="wa-stack wa-gap-xs"
        [style.padding]="
          sidebarOpen ? 'var(--wa-space-m)' : 'var(--wa-space-s)'
        "
        style="background: var(--wa-color-surface-lowered); transition: var(--wa-transition-fast); overflow: hidden"
        aria-label="Main navigation"
      >
        <div class="wa-split wa-align-items-center">
          @if (sidebarOpen) {
            <strong class="wa-heading-s">My App</strong>
          }
          <k-button
            variant="neutral"
            appearance="plain"
            size="small"
            [attr.aria-label]="
              sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'
            "
            (click)="sidebarOpen = !sidebarOpen"
          >
            <k-icon [name]="sidebarOpen ? 'chevron-left' : 'chevron-right'" />
          </k-button>
        </div>
        <k-divider />
        @for (item of navItems; track item.id) {
          <k-button
            [variant]="currentPage === item.id ? 'brand' : 'neutral'"
            appearance="plain"
            style="justify-content: flex-start"
            (click)="navigate.emit(item.id)"
          >
            <k-icon slot="start" [name]="item.icon" />
            @if (sidebarOpen) {
              <span>{{ item.label }}</span>
            }
          </k-button>
        }
      </nav>

      <!-- Content area - use Angular Router's <router-outlet /> for routing -->
      <main
        class="wa-stack wa-gap-l"
        style="padding: var(--wa-space-l); flex: 1"
      >
        <!-- <router-outlet /> - uncomment when using @angular/router -->
        <ng-content />
      </main>
    </div>
  `,
})
export class AppShellComponent {
  @Input() currentPage = '';
  @Output() navigate = new EventEmitter<string>();

  sidebarOpen = true;

  navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'chart-line' },
    { id: 'users', label: 'Users', icon: 'users' },
    { id: 'settings', label: 'Settings', icon: 'gear' },
  ];
}
```

---

## B: Dashboard

App Shell + metric card grid + sections.

**Required components:** `npx kigumi add card icon format-number`

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { CardComponent } from '@/components/ui/Card/card.component';
import { FormatNumberComponent } from '@/components/ui/FormatNumber/format-number.component';
import { IconComponent } from '@/components/ui/Icon/icon.component';

interface Metric {
  label: string;
  value: number;
  icon: string;
  type?: 'currency' | 'decimal' | 'percent';
}

@Component({
  selector: 'app-dashboard-content',
  standalone: true,
  imports: [CardComponent, FormatNumberComponent, IconComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="wa-stack wa-gap-l">
      <h1 class="wa-heading-xl">Dashboard</h1>

      <div class="wa-grid" style="--min-column-size: 250px">
        @for (m of metrics; track m.label) {
          <k-card>
            <div class="wa-split">
              <div class="wa-stack wa-gap-2xs">
                <span
                  class="wa-body-s"
                  style="color: var(--wa-color-text-quiet)"
                >
                  {{ m.label }}
                </span>
                <strong class="wa-heading-l">
                  <k-format-number
                    [value]="m.value"
                    [type]="m.type || 'decimal'"
                    [currency]="m.type === 'currency' ? 'USD' : undefined"
                  />
                </strong>
              </div>
              <k-icon
                [name]="m.icon"
                style="font-size: 2rem; color: var(--wa-color-brand)"
              />
            </div>
          </k-card>
        }
      </div>

      <section class="wa-stack wa-gap-m">
        <h2 class="wa-heading-m">Recent Activity</h2>
        <!-- Activity list here - use kigumi-compose-data skill for data tables -->
      </section>
    </div>
  `,
})
export class DashboardContentComponent {
  @Input() metrics: Metric[] = [];
}
```

---

## C: Settings Page

TabGroup + collapsible Details sections.

**Required components:** `npx kigumi add button details divider input option radio radio-group select switch tab tab-group tab-panel`

### Tab-Panel Linking Convention

Tab and TabPanel components are linked by matching string identifiers:

1. Each `<k-tab>` needs `slot="nav"` and `panel="panelName"`
2. Each `<k-tab-panel>` needs `name="panelName"` (must match the Tab's `panel` prop)

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ButtonComponent } from '@/components/ui/Button/button.component';
import { DetailsComponent } from '@/components/ui/Details/details.component';
import { InputComponent } from '@/components/ui/Input/input.component';
import { OptionComponent } from '@/components/ui/Option/option.component';
import { RadioComponent } from '@/components/ui/Radio/radio.component';
import { RadioGroupComponent } from '@/components/ui/RadioGroup/radio-group.component';
import { SelectComponent } from '@/components/ui/Select/select.component';
import { SwitchComponent } from '@/components/ui/Switch/switch.component';
import { TabComponent } from '@/components/ui/Tab/tab.component';
import { TabGroupComponent } from '@/components/ui/TabGroup/tab-group.component';
import { TabPanelComponent } from '@/components/ui/TabPanel/tab-panel.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    ButtonComponent,
    DetailsComponent,
    InputComponent,
    OptionComponent,
    RadioComponent,
    RadioGroupComponent,
    SelectComponent,
    SwitchComponent,
    TabComponent,
    TabGroupComponent,
    TabPanelComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="wa-stack wa-gap-l" style="max-width: 800px">
      <h1 class="wa-heading-xl">Settings</h1>
      <k-tab-group>
        <k-tab slot="nav" panel="general">General</k-tab>
        <k-tab slot="nav" panel="notifications">Notifications</k-tab>
        <k-tab slot="nav" panel="security">Security</k-tab>

        <k-tab-panel name="general">
          <div class="wa-stack wa-gap-m">
            <k-details summary="Profile" [open]="true">
              <div class="wa-stack wa-gap-m">
                <div class="wa-grid" style="--min-column-size: 200px">
                  <k-input label="First name" name="firstName" />
                  <k-input label="Last name" name="lastName" />
                </div>
                <k-input label="Email" name="email" type="email" />
              </div>
            </k-details>
            <k-details summary="Preferences">
              <div class="wa-stack wa-gap-m">
                <k-select label="Language">
                  <k-option value="en">English</k-option>
                  <k-option value="de">Deutsch</k-option>
                </k-select>
                <k-radio-group label="Theme" value="system">
                  <k-radio value="light">Light</k-radio>
                  <k-radio value="dark">Dark</k-radio>
                  <k-radio value="system">System</k-radio>
                </k-radio-group>
              </div>
            </k-details>
          </div>
        </k-tab-panel>

        <k-tab-panel name="notifications">
          <div class="wa-stack wa-gap-m">
            <k-switch [checked]="true">Email notifications</k-switch>
            <k-switch>Push notifications</k-switch>
          </div>
        </k-tab-panel>

        <k-tab-panel name="security">
          <!-- Use kigumi-compose-form skill for validated form submission -->
          <div class="wa-stack wa-gap-m">
            <k-input label="Current password" type="password" />
            <k-input label="New password" type="password" />
            <k-button variant="brand">Update password</k-button>
          </div>
        </k-tab-panel>
      </k-tab-group>
    </div>
  `,
})
export class SettingsPageComponent {}
```

---

## D: Marketing / Landing Page

Full-width sections stacked vertically. Hero uses `.wa-dark` for a dark section demo.

**Required components:** `npx kigumi add button card icon`

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ButtonComponent } from '@/components/ui/Button/button.component';
import { CardComponent } from '@/components/ui/Card/card.component';
import { IconComponent } from '@/components/ui/Icon/icon.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [ButtonComponent, CardComponent, IconComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="wa-stack wa-gap-0">
      <!-- Hero - .wa-dark inverts all --wa-color-* tokens in this section -->
      <section
        class="wa-dark wa-split"
        style="padding: var(--wa-space-3xl) var(--wa-space-l); align-items: center; background: var(--wa-color-surface-default)"
      >
        <div class="wa-stack wa-gap-m" style="max-width: 500px">
          <h1 class="wa-heading-2xl" style="color: var(--wa-color-text-normal)">
            Build faster with Kigumi
          </h1>
          <p class="wa-body-l" style="color: var(--wa-color-text-quiet)">
            Ready-made Web Awesome components for React, Vue, and Angular.
          </p>
          <div class="wa-cluster wa-gap-s">
            <k-button variant="brand" size="large">Get Started</k-button>
            <k-button variant="neutral" size="large" appearance="outlined"
              >View Docs</k-button
            >
          </div>
        </div>
        <div class="wa-frame wa-frame:landscape" style="max-width: 500px">
          <img src="/hero.png" alt="Product screenshot" />
        </div>
      </section>

      <!-- Features -->
      <section
        class="wa-stack wa-gap-l"
        style="padding: var(--wa-space-2xl) var(--wa-space-l)"
      >
        <h2 class="wa-heading-xl" style="text-align: center">Features</h2>
        <div class="wa-grid" style="--min-column-size: 280px">
          @for (f of features; track f.icon) {
            <k-card>
              <div
                class="wa-stack wa-gap-s wa-align-items-center"
                style="text-align: center; padding: var(--wa-space-m)"
              >
                <k-icon
                  [name]="f.icon"
                  style="font-size: 2rem; color: var(--wa-color-brand)"
                />
                <strong class="wa-heading-s">{{ f.title }}</strong>
                <p class="wa-body-m" style="color: var(--wa-color-text-quiet)">
                  {{ f.description }}
                </p>
              </div>
            </k-card>
          }
        </div>
      </section>

      <!-- CTA - another .wa-dark section -->
      <section
        class="wa-dark"
        style="padding: var(--wa-space-2xl) var(--wa-space-l); background: var(--wa-color-surface-default)"
      >
        <div
          class="wa-stack wa-gap-m wa-align-items-center"
          style="text-align: center"
        >
          <h2 class="wa-heading-xl" style="color: var(--wa-color-text-normal)">
            Ready to get started?
          </h2>
          <p class="wa-body-l" style="color: var(--wa-color-text-quiet)">
            Join thousands of developers building with Kigumi.
          </p>
          <k-button variant="brand" size="large">Get Started Free</k-button>
        </div>
      </section>
    </div>
  `,
})
export class LandingPageComponent {
  features = [
    {
      icon: 'bolt',
      title: 'Fast',
      description: 'CLI generates components in seconds.',
    },
    {
      icon: 'palette',
      title: 'Themeable',
      description: 'CSS custom properties for full control.',
    },
    {
      icon: 'universal-access',
      title: 'Accessible',
      description: 'WCAG 2.1 AA built into every component.',
    },
  ];
}
```

---

## E: Data Browser

Filters sidebar + data content area.

**Required components:** `npx kigumi add button checkbox divider input slider tab tab-group tab-panel`

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ButtonComponent } from '@/components/ui/Button/button.component';
import { CheckboxComponent } from '@/components/ui/Checkbox/checkbox.component';
import { DividerComponent } from '@/components/ui/Divider/divider.component';
import { InputComponent } from '@/components/ui/Input/input.component';
import { SliderComponent } from '@/components/ui/Slider/slider.component';
import { TabComponent } from '@/components/ui/Tab/tab.component';
import { TabGroupComponent } from '@/components/ui/TabGroup/tab-group.component';
import { TabPanelComponent } from '@/components/ui/TabPanel/tab-panel.component';

@Component({
  selector: 'app-data-browser',
  standalone: true,
  imports: [
    ButtonComponent,
    CheckboxComponent,
    DividerComponent,
    InputComponent,
    SliderComponent,
    TabComponent,
    TabGroupComponent,
    TabPanelComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="wa-flank wa-gap-l" style="--flank-size: 260px">
      <!-- Filters sidebar -->
      <aside class="wa-stack wa-gap-m" aria-label="Filters">
        <h2 class="wa-heading-s">Filters</h2>
        <k-input label="Search" type="search" [withClear]="true" />
        <k-divider />
        <fieldset class="wa-stack wa-gap-xs">
          <legend class="wa-body-s wa-font-weight-semibold">Category</legend>
          <k-checkbox [checked]="true">Electronics</k-checkbox>
          <k-checkbox [checked]="true">Clothing</k-checkbox>
          <k-checkbox>Books</k-checkbox>
        </fieldset>
        <k-divider />
        <k-slider
          label="Max price"
          [min]="0"
          [max]="1000"
          [value]="500"
          [withTooltip]="true"
        />
        <k-button variant="brand" size="small" style="width: 100%">
          Apply Filters
        </k-button>
      </aside>

      <!-- Content area - use kigumi-compose-data skill for data tables -->
      <main class="wa-stack wa-gap-m">
        <h1 class="wa-heading-xl">Products</h1>
        <k-tab-group>
          <k-tab slot="nav" panel="list">List</k-tab>
          <k-tab slot="nav" panel="grid">Grid</k-tab>
          <k-tab-panel name="list">
            <p class="wa-body-m">Data table goes here</p>
          </k-tab-panel>
          <k-tab-panel name="grid">
            <div class="wa-grid" style="--min-column-size: 200px">
              <!-- Grid cards here -->
            </div>
          </k-tab-panel>
        </k-tab-group>
      </main>
    </div>
  `,
})
export class DataBrowserComponent {}
```

---

## F: Page Shell (Pro)

Full-page layout using the `<Page>` component (Pro tier). Provides header, navigation (with automatic mobile hamburger), and main content slots. **This is the recommended approach for Pro users building app shells and dashboards.**

**Required components:** `npx kigumi add page avatar button divider icon`

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AvatarComponent } from '@/components/ui/Avatar/avatar.component';
import { ButtonComponent } from '@/components/ui/Button/button.component';
import { IconComponent } from '@/components/ui/Icon/icon.component';
import { PageComponent } from '@/components/ui/Page/page.component';

@Component({
  selector: 'app-page-shell',
  standalone: true,
  imports: [AvatarComponent, ButtonComponent, IconComponent, PageComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <k-page mobile-breakpoint="768px">
      <!-- Header slot -->
      <div
        slot="header"
        class="wa-split wa-align-items-center"
        style="padding: var(--wa-space-s) var(--wa-space-m)"
      >
        <strong class="wa-heading-s">My App</strong>
        <div class="wa-cluster wa-gap-s wa-align-items-center">
          <k-button variant="neutral" appearance="plain" size="small"
            >Docs</k-button
          >
          <k-avatar initials="M" shape="circle" />
        </div>
      </div>

      <!-- Navigation slot - auto hamburger on mobile -->
      <nav
        slot="navigation"
        class="wa-stack wa-gap-xs"
        style="padding: var(--wa-space-m)"
      >
        <k-button
          variant="brand"
          appearance="plain"
          style="justify-content: flex-start"
        >
          <k-icon slot="start" name="house" />Dashboard
        </k-button>
        <k-button
          variant="neutral"
          appearance="plain"
          style="justify-content: flex-start"
        >
          <k-icon slot="start" name="users" />Users
        </k-button>
        <k-button
          variant="neutral"
          appearance="plain"
          style="justify-content: flex-start"
        >
          <k-icon slot="start" name="gear" />Settings
        </k-button>
      </nav>

      <!-- Default slot = main content -->
      <!-- Use Angular Router's <router-outlet /> for routing -->
      <ng-content />

      <!-- Footer slot -->
      <div
        slot="footer"
        class="wa-split wa-align-items-center"
        style="padding: var(--wa-space-s) var(--wa-space-m)"
      >
        <small style="color: var(--wa-color-text-quiet)">2026 My App</small>
        <div class="wa-cluster wa-gap-s">
          <a href="/privacy" class="wa-link">Privacy</a>
          <a href="/terms" class="wa-link">Terms</a>
        </div>
      </div>
    </k-page>
  `,
})
export class PageShellComponent {}
```

### Key Props

| Prop                        | Default | Purpose                                         |
| --------------------------- | ------- | ----------------------------------------------- |
| `mobile-breakpoint`         | `768px` | Viewport width for mobile/desktop switch        |
| `disable-navigation-toggle` | `false` | Hide built-in hamburger (use for custom toggle) |
| `navigation-placement`      | `start` | Navigation drawer position (`start` or `end`)   |
| `nav-open`                  | `false` | Programmatic control of mobile nav drawer       |

### Slot Reference

| Slot         | Element                   | Purpose                            |
| ------------ | ------------------------- | ---------------------------------- |
| `header`     | `<div slot="header">`     | Top bar (logo, user menu)          |
| `navigation` | `<nav slot="navigation">` | Mobile drawer nav (auto hamburger) |
| `footer`     | `<div slot="footer">`     | Page footer                        |
| (default)    | `<ng-content />`          | Main content area                  |
