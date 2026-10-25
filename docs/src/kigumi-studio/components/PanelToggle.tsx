import clsx from 'clsx';
import { Button, Icon } from '@/components/ui';

interface PanelToggleProps {
  /** The panel's side: the tab sits on its inner edge, towards the preview. */
  side: 'start' | 'end';
  open: boolean;
  /** The panel's own icon, shown while it is collapsed. */
  icon: string;
  /** The panel's name, for the button's label. */
  label: string;
  onToggle: () => void;
}

/**
 * The tab on a side panel's inner edge that shows and hides it: the panel's
 * icon while collapsed, an x while open. Styles and the Theme Agent share it,
 * mirrored.
 */
export function PanelToggle({
  side,
  open,
  icon,
  label,
  onToggle,
}: PanelToggleProps) {
  return (
    <Button
      className={clsx('studio-panel-toggle', `studio-panel-toggle--${side}`)}
      appearance="filled"
      size="small"
      onClick={onToggle}
    >
      {/* The icon names the button: an aria-label on wa-button's host is
          not exposed to the accessibility tree. */}
      <Icon
        name={open ? 'xmark' : icon}
        label={open ? `Hide ${label}` : `Show ${label}`}
      />
    </Button>
  );
}
