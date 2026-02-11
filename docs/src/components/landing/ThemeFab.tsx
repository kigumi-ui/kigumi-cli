import { useTheme } from '@/contexts/ThemeContext';
import { Button, Icon } from '@/components/ui';

export const ThemeFab = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Button
      pill
      variant="neutral"
      size="small"
      appearance="outlined"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Icon name={isDark ? 'sun' : 'moon'} />
    </Button>
  );
};
