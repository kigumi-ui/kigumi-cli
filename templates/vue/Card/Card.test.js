import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Card from './Card.vue';

describe('Card', () => {
  it('renders without crashing', () => {
    const { container } = render(Card);
    expect(container.querySelector('wa-card')).toBeTruthy();
  });
});
