import { useTheme } from '@/contexts/ThemeContext';
import { Button, Icon } from '../ui';
import '../../styles/ThemeFab.css';

export const ThemeFab = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="ThemeFab">
      <Button
        pill
        variant="brand"
        size="large"
        appearance="filled"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <Icon name={isDark ? 'sun' : 'moon'} />
      </Button>
    </div>
  );
};
