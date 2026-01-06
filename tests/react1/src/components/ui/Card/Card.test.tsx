import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders without crashing', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Card className="custom-class">Test</Card>
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('renders with appearance', () => {
    const { container } = render(
      <Card appearance="filled">Filled Card</Card>
    );
    const card = container.querySelector('wa-card');
    expect(card).toHaveAttribute('appearance', 'filled');
  });

  it('renders with orientation', () => {
    const { container } = render(
      <Card orientation="horizontal">Horizontal Card</Card>
    );
    const card = container.querySelector('wa-card');
    expect(card).toHaveAttribute('orientation', 'horizontal');
  });
});
