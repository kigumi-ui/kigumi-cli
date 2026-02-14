import { useTheme } from '@/contexts/ThemeContext';
import { Button, Icon, Dropdown, DropdownItem } from '@/components/ui';

export const ThemeFab = () => {
  const { theme, setTheme, isDark } = useTheme();

  const handleThemeSelect = (event: CustomEvent) => {
    const selectedTheme = event.detail.item.value;
    setTheme(selectedTheme);
  };

  const getIconName = () => {
    if (theme === 'system') return 'circle-half-stroke';
    return isDark ? 'moon' : 'sun';
  };

  return (
    <Dropdown size="small" placement="bottom-end" onSelect={handleThemeSelect}>
      <Button
        slot="trigger"
        pill
        variant="neutral"
        size="small"
        appearance="outlined"
        aria-label="Theme menu"
      >
        <Icon name={getIconName()} />
      </Button>
      <DropdownItem type="checkbox" checked={theme === 'light'} value="light">
        <Icon name="sun" slot="start" />
        Light
      </DropdownItem>
      <DropdownItem type="checkbox" checked={theme === 'dark'} value="dark">
        <Icon name="moon" slot="start" />
        Dark
      </DropdownItem>
      <DropdownItem type="checkbox" checked={theme === 'system'} value="system">
        <Icon name="circle-half-stroke" slot="start" />
        System
      </DropdownItem>
    </Dropdown>
  );
};
