import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon/Icon';

export function Header() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header slot="header">
      <div className="Header__content">
        <span className="wa-heading-xl">Kigumi</span>
        <Button appearance="outlined" size="small" onClick={toggleTheme}>
          <Icon name={isDark ? 'sun' : 'moon'} />
        </Button>
      </div>
    </header>
  );
}
