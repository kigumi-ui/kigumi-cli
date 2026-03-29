/**
 * Contact Form
 *
 * Install missing components:
 *   npx kigumi add input textarea button callout
 */

import { useState, type FormEvent } from 'react';
import { Button, Callout, Input, Textarea } from '@/components/ui';

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const data = new FormData(e.currentTarget);
      const res = await fetch('/api/contact', { method: 'POST', body: data });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || 'Failed to send message');
      }

      setSuccess(true);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="wa-stack wa-gap-l"
      style={{ maxWidth: '60ch' }}
      onSubmit={handleSubmit}
    >
      {error && <Callout variant="danger">{error}</Callout>}
      {success && (
        <Callout variant="success">Your message has been sent. We will get back to you soon.</Callout>
      )}

      <Input
        label="Name"
        name="name"
        required
        hint="Your full name"
      />

      <Input
        label="Email"
        name="email"
        type="email"
        required
        hint="We will never share your email"
      />

      <Textarea
        label="Message"
        name="message"
        rows={4}
        resize="auto"
        hint="How can we help you?"
      />

      <div className="wa-cluster wa-justify-content-end wa-gap-s">
        <Button variant="neutral" type="reset">
          Clear
        </Button>
        <Button variant="brand" type="submit" loading={loading}>
          Send Message
        </Button>
      </div>
    </form>
  );
}
