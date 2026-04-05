# Form Patterns -- Angular

Angular standalone component versions of all form patterns.
Angular wrappers implement ControlValueAccessor, so use `[(ngModel)]` (FormsModule)
or `[formControl]` (ReactiveFormsModule) instead of manual event wiring.

## Critical: Angular Form Controls

Kigumi Angular wrappers support `[(ngModel)]` natively via CVA. **Do not manually wire `(inputEvent)` or `(change)` for value tracking.** Only use event bindings for side effects.

```typescript
// CORRECT: use ngModel
<k-input [(ngModel)]="email" label="Email" />

// WRONG: manual event wiring for value tracking
<k-input (inputEvent)="email = $event.target.value" label="Email" />
```

For forms that only need `name` attributes (FormData-based submission), `[(ngModel)]` is optional -- native form behavior works.

---

## Pattern A: Contact Form

Simple form with text inputs and textarea.

**Components needed:** `npx kigumi add input textarea button callout`

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '@/components/ui/Button/button.component';
import { CalloutComponent } from '@/components/ui/Callout/callout.component';
import { InputComponent } from '@/components/ui/Input/input.component';
import { TextareaComponent } from '@/components/ui/Textarea/textarea.component';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [
    FormsModule,
    ButtonComponent,
    CalloutComponent,
    InputComponent,
    TextareaComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <form
      class="wa-stack wa-gap-l"
      style="max-width: 60ch"
      (submit)="handleSubmit($event)"
    >
      @if (error) {
        <k-callout variant="danger">{{ error }}</k-callout>
      }

      <div class="wa-grid" style="--min-column-size: 200px">
        <k-input label="First name" name="firstName" [required]="true" />
        <k-input label="Last name" name="lastName" [required]="true" />
      </div>

      <k-input label="Email" name="email" type="email" [required]="true" />
      <k-textarea
        label="Message"
        name="message"
        [rows]="4"
        [required]="true"
        resize="auto"
      />

      <div class="wa-cluster wa-justify-content-end wa-gap-s">
        <k-button variant="neutral" type="reset">Clear</k-button>
        <k-button variant="brand" type="submit" [loading]="loading"
          >Send Message</k-button
        >
      </div>
    </form>
  `,
})
export class ContactFormComponent {
  loading = false;
  error = '';

  async handleSubmit(e: Event) {
    e.preventDefault();
    this.loading = true;
    this.error = '';
    try {
      const data = new FormData(e.target as HTMLFormElement);
      await fetch('/api/contact', { method: 'POST', body: data });
    } catch {
      this.error = 'Failed to send message. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}
```

---

## Pattern B: Login Form

Login with email, password, remember-me, and error display.

**Components needed:** `npx kigumi add input checkbox button callout`

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '@/components/ui/Button/button.component';
import { CalloutComponent } from '@/components/ui/Callout/callout.component';
import { CheckboxComponent } from '@/components/ui/Checkbox/checkbox.component';
import { InputComponent } from '@/components/ui/Input/input.component';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [
    FormsModule,
    ButtonComponent,
    CalloutComponent,
    CheckboxComponent,
    InputComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <form
      class="wa-stack wa-gap-l"
      style="max-width: 400px; margin: 0 auto"
      (submit)="handleSubmit($event)"
    >
      <h1 style="text-align: center">Sign In</h1>

      @if (error) {
        <k-callout variant="danger">{{ error }}</k-callout>
      }

      <k-input
        label="Email"
        type="email"
        [required]="true"
        [(ngModel)]="email"
        name="email"
      />
      <k-input
        label="Password"
        type="password"
        [required]="true"
        [passwordToggle]="true"
        [(ngModel)]="password"
        name="password"
      />
      <k-checkbox [(ngModel)]="remember" name="remember"
        >Remember me</k-checkbox
      >

      <k-button
        variant="brand"
        type="submit"
        [loading]="loading"
        style="width: 100%"
      >
        Sign In
      </k-button>
    </form>
  `,
})
export class LoginFormComponent {
  email = '';
  password = '';
  remember = false;
  loading = false;
  error = '';

  async handleSubmit(e: Event) {
    e.preventDefault();
    this.loading = true;
    this.error = '';
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.email,
          password: this.password,
          remember: this.remember,
        }),
      });
      if (!res.ok) throw new Error('Invalid credentials');
      window.location.href = '/dashboard';
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Login failed';
    } finally {
      this.loading = false;
    }
  }
}
```

---

## Pattern C: Settings Form

Grouped settings with multiple control types, organized by tabs and collapsible sections.

**Components needed:** `npx kigumi add input select option switch radio-group radio details tab-group tab tab-panel button divider`

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ButtonComponent } from '@/components/ui/Button/button.component';
import { DetailsComponent } from '@/components/ui/Details/details.component';
import { DividerComponent } from '@/components/ui/Divider/divider.component';
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
  selector: 'app-settings-form',
  standalone: true,
  imports: [
    ButtonComponent,
    DetailsComponent,
    DividerComponent,
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
    <form
      class="wa-stack wa-gap-l"
      style="max-width: 800px"
      (submit)="handleSubmit($event)"
    >
      <h1>Settings</h1>

      <k-tab-group>
        <k-tab slot="nav" panel="profile">Profile</k-tab>
        <k-tab slot="nav" panel="preferences">Preferences</k-tab>
        <k-tab slot="nav" panel="notifications">Notifications</k-tab>

        <k-tab-panel name="profile">
          <div class="wa-stack wa-gap-m">
            <k-details summary="Personal Information" [open]="true">
              <div class="wa-stack wa-gap-m">
                <div class="wa-grid" style="--min-column-size: 200px">
                  <k-input label="First name" name="firstName" />
                  <k-input label="Last name" name="lastName" />
                </div>
                <k-input label="Email" name="email" type="email" />
                <k-input label="Phone" name="phone" type="tel" />
              </div>
            </k-details>
            <k-details summary="Bio">
              <k-input label="Job title" name="jobTitle" />
            </k-details>
          </div>
        </k-tab-panel>

        <k-tab-panel name="preferences">
          <div class="wa-stack wa-gap-m">
            <k-select label="Language" name="language">
              <k-option value="en">English</k-option>
              <k-option value="de">Deutsch</k-option>
              <k-option value="ja">Japanese</k-option>
            </k-select>
            <k-select label="Timezone" name="timezone">
              <k-option value="utc">UTC</k-option>
              <k-option value="est">Eastern</k-option>
              <k-option value="pst">Pacific</k-option>
            </k-select>
            <k-radio-group label="Theme" name="theme" value="system">
              <k-radio value="light">Light</k-radio>
              <k-radio value="dark">Dark</k-radio>
              <k-radio value="system">System</k-radio>
            </k-radio-group>
          </div>
        </k-tab-panel>

        <k-tab-panel name="notifications">
          <div class="wa-stack wa-gap-m">
            <k-switch name="emailNotifs" [checked]="true"
              >Email notifications</k-switch
            >
            <k-switch name="pushNotifs">Push notifications</k-switch>
            <k-switch name="weeklyDigest" [checked]="true"
              >Weekly digest</k-switch
            >
          </div>
        </k-tab-panel>
      </k-tab-group>

      <k-divider />
      <div class="wa-cluster wa-justify-content-end wa-gap-s">
        <k-button variant="neutral" type="reset">Reset</k-button>
        <k-button variant="brand" type="submit">Save Changes</k-button>
      </div>
    </form>
  `,
})
export class SettingsFormComponent {
  handleSubmit(e: Event) {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    console.log(Object.fromEntries(data));
  }
}
```

---

## Pattern D: Multi-Step Wizard

Step-by-step form with validation per step.

**Components needed:** `npx kigumi add input select option checkbox button progress-bar`

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ButtonComponent } from '@/components/ui/Button/button.component';
import { CheckboxComponent } from '@/components/ui/Checkbox/checkbox.component';
import { InputComponent } from '@/components/ui/Input/input.component';
import { OptionComponent } from '@/components/ui/Option/option.component';
import { ProgressBarComponent } from '@/components/ui/ProgressBar/progress-bar.component';
import { SelectComponent } from '@/components/ui/Select/select.component';

@Component({
  selector: 'app-signup-wizard',
  standalone: true,
  imports: [
    ButtonComponent,
    CheckboxComponent,
    InputComponent,
    OptionComponent,
    ProgressBarComponent,
    SelectComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <form
      class="wa-stack wa-gap-l"
      style="max-width: 500px"
      (submit)="handleSubmit($event)"
    >
      <k-progress-bar
        [value]="(step / (steps.length - 1)) * 100"
        [label]="'Step ' + (step + 1) + ' of ' + steps.length"
      >
        {{ steps[step] }}
      </k-progress-bar>

      @if (step === 0) {
        <div class="wa-stack wa-gap-m">
          <k-input label="Email" name="email" type="email" [required]="true" />
          <k-input
            label="Password"
            name="password"
            type="password"
            [required]="true"
            [minlength]="8"
            [passwordToggle]="true"
          />
          <k-input
            label="Confirm password"
            name="confirmPassword"
            type="password"
            [required]="true"
          />
        </div>
      }

      @if (step === 1) {
        <div class="wa-stack wa-gap-m">
          <k-input label="Full name" name="fullName" [required]="true" />
          <k-select label="Role" name="role">
            <k-option value="developer">Developer</k-option>
            <k-option value="designer">Designer</k-option>
            <k-option value="manager">Manager</k-option>
          </k-select>
        </div>
      }

      @if (step === 2) {
        <div class="wa-stack wa-gap-m">
          <p>Review your information and confirm.</p>
          <k-checkbox name="terms" [required]="true"
            >I agree to the Terms of Service</k-checkbox
          >
        </div>
      }

      <div class="wa-cluster wa-justify-content-space-between">
        <k-button
          variant="neutral"
          type="button"
          [disabled]="step === 0"
          (click)="step = step - 1"
        >
          Back
        </k-button>
        <k-button variant="brand" type="submit" [loading]="loading">
          {{ step < steps.length - 1 ? 'Next' : 'Create Account' }}
        </k-button>
      </div>
    </form>
  `,
})
export class SignupWizardComponent {
  step = 0;
  loading = false;
  steps = ['Account', 'Profile', 'Confirm'];

  async handleSubmit(e: Event) {
    e.preventDefault();
    if (this.step < this.steps.length - 1) {
      this.step++;
      return;
    }
    this.loading = true;
    const data = new FormData(e.target as HTMLFormElement);
    await fetch('/api/signup', { method: 'POST', body: data });
    this.loading = false;
  }
}
```
