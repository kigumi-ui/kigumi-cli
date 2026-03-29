import { useState } from 'react';
import { Button, Card, Input, Textarea } from '@/components/ui';

interface FormValues {
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

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) {
    errors.name = 'Name is required.';
  }
  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!validateEmail(values.email)) {
    errors.email = 'Please enter a valid email address.';
  }
  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState<FormValues>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleNameInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    setValues((prev) => ({ ...prev, name: value }));
    if (touched.name) {
      setErrors((prev) => ({
        ...prev,
        name: value.trim() ? undefined : 'Name is required.',
      }));
    }
  }

  function handleEmailInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    setValues((prev) => ({ ...prev, email: value }));
    if (touched.email) {
      const emailError = !value.trim()
        ? 'Email is required.'
        : !validateEmail(value)
          ? 'Please enter a valid email address.'
          : undefined;
      setErrors((prev) => ({ ...prev, email: emailError }));
    }
  }

  function handleMessageInput(e: CustomEvent) {
    const value = (e.target as HTMLTextAreaElement).value;
    setValues((prev) => ({ ...prev, message: value }));
  }

  function handleBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldErrors = validate(values);
    setErrors((prev) => ({ ...prev, [field]: fieldErrors[field as keyof FormErrors] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true });
    const fieldErrors = validate(values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      // Simulate async submission
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="wa-stack wa-justify-content-center wa-align-items-center">
        <Card style={{ width: '480px', marginTop: '40px' }}>
          <div className="wa-stack wa-gap-m" style={{ textAlign: 'center' }}>
            <p className="wa-body-m" style={{ color: 'var(--wa-color-success-60)' }}>
              Your message has been sent. We'll be in touch soon.
            </p>
            <Button
              variant="neutral"
              appearance="outlined"
              size="medium"
              onClick={() => {
                setValues({ name: '', email: '', message: '' });
                setErrors({});
                setTouched({});
                setSubmitted(false);
              }}
            >
              Send another message
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="wa-stack wa-justify-content-center wa-align-items-center">
      <Card style={{ width: '480px', marginTop: '40px' }}>
        <div className="wa-stack wa-gap-l">
          <h2 className="wa-heading-s" style={{ margin: 0 }}>
            Contact Us
          </h2>

          <form className="wa-stack wa-gap-m" onSubmit={handleSubmit} noValidate>
            <div className="wa-stack wa-gap-3xs">
              <Input
                label="Name"
                name="name"
                type="text"
                value={values.name}
                required
                onInput={handleNameInput}
                onBlur={() => handleBlur('name')}
              />
              {errors.name && (
                <span
                  className="wa-caption-s"
                  style={{ color: 'var(--wa-color-danger-60)' }}
                  role="alert"
                >
                  {errors.name}
                </span>
              )}
            </div>

            <div className="wa-stack wa-gap-3xs">
              <Input
                label="Email"
                name="email"
                type="email"
                value={values.email}
                required
                onInput={handleEmailInput}
                onBlur={() => handleBlur('email')}
              />
              {errors.email && (
                <span
                  className="wa-caption-s"
                  style={{ color: 'var(--wa-color-danger-60)' }}
                  role="alert"
                >
                  {errors.email}
                </span>
              )}
            </div>

            <Textarea
              label="Message"
              name="message"
              value={values.message}
              rows={5}
              resize="vertical"
              placeholder="How can we help you?"
              onInput={handleMessageInput}
            />

            <Button
              type="submit"
              variant="brand"
              size="medium"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
