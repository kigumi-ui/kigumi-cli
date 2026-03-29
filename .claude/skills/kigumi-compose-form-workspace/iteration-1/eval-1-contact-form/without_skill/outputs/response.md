# Contact Form

## Prerequisites

Install the required Kigumi components:

```bash
npx kigumi add Input Textarea Button
```

## Component Code

Create `ContactForm.tsx`:

```tsx
import { useState, type FormEvent } from 'react';
import { Button, Input, Textarea } from '@/components/ui';

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm(data: ContactFormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.name.trim()) {
    errors.name = 'Name is required';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  return errors;
}

export function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleInput(field: keyof ContactFormData) {
    return (e: Event) => {
      const target = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [field]: target.value }));

      // Clear error for this field on input
      if (errors[field as keyof FormErrors]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field as keyof FormErrors];
          return next;
        });
      }
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const validationErrors = validateForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Replace with your actual submission logic
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setErrors({});
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="wa-stack wa-gap-m wa-align-items-center"
        style={{ padding: 'var(--wa-spacing-l)' }}
      >
        <p className="wa-heading-s">Thank you for your message!</p>
        <p
          className="wa-body-s"
          style={{ color: 'var(--wa-color-neutral-60)' }}
        >
          We will get back to you soon.
        </p>
        <Button appearance="outlined" onClick={() => setSubmitted(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form className="wa-stack wa-gap-m" onSubmit={handleSubmit} noValidate>
      <Input
        label="Name"
        placeholder="Your full name"
        value={formData.name}
        required
        onInput={handleInput('name')}
        hint={errors.name}
        data-user-invalid={errors.name ? '' : undefined}
      />

      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={formData.email}
        required
        onInput={handleInput('email')}
        hint={errors.email}
        data-user-invalid={errors.email ? '' : undefined}
      />

      <Textarea
        label="Message"
        placeholder="How can we help you?"
        value={formData.message}
        rows={4}
        resize="vertical"
        onInput={handleInput('message')}
      />

      <Button
        variant="brand"
        type="submit"
        loading={isSubmitting}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
}
```

## Usage

```tsx
import { ContactForm } from '@/components/examples/ContactForm';

function App() {
  return (
    <div
      style={{
        maxWidth: '480px',
        margin: '0 auto',
        padding: 'var(--wa-spacing-l)',
      }}
    >
      <h1
        className="wa-heading-m"
        style={{ marginBottom: 'var(--wa-spacing-m)' }}
      >
        Contact Us
      </h1>
      <ContactForm />
    </div>
  );
}
```

## How It Works

**Components used:**

- `Input` -- text field for name, email field with `type="email"` for email address
- `Textarea` -- multi-line text field for the message body
- `Button` -- submit button with `variant="brand"` for primary action styling

**Validation:**

- Name field is required; shows an error hint if left empty on submit
- Email field is required and must match a standard email pattern (`user@domain.tld`)
- Errors clear as the user types into the affected field
- The `data-user-invalid` attribute triggers Web Awesome's built-in invalid styling on the input
- Form uses `noValidate` to bypass native browser validation in favor of custom logic

**Loading state:**

- The `loading` prop on `Button` shows Web Awesome's built-in spinner animation
- The button is also `disabled` during submission to prevent double-sends
- Button text changes to "Sending..." while the request is in flight

**After submission:**

- A success message replaces the form
- A "Send another message" button resets the view back to the empty form
