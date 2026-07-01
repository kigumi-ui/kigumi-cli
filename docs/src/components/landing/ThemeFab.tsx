import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button/Button';
import { Icon } from '@/components/ui/Icon/Icon';
import { Dropdown } from '@/components/ui/Dropdown/Dropdown';
import { DropdownItem } from '@/components/ui/DropdownItem/DropdownItem';
import { Tooltip } from '@/components/ui/Tooltip/Tooltip';

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
    <>
      <Tooltip for="button-theme">Change color scheme</Tooltip>
      <Dropdown
        size="small"
        placement="bottom-end"
        onSelect={handleThemeSelect}
      >
        <Button
          id="button-theme"
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
        <DropdownItem
          type="checkbox"
          checked={theme === 'system'}
          value="system"
        >
          <Icon name="circle-half-stroke" slot="start" />
          System
        </DropdownItem>
      </Dropdown>
    </>
  );
};
