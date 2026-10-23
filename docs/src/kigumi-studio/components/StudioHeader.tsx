import type { RefObject } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Badge, Button, type ButtonRef } from '@/components/ui';
import { ThemeFab } from '@/components/landing/ThemeFab';
import logoImg from '@/assets/icon.svg';
import './StudioHeader.css';
import { StudioKnowledgeBase } from './knowledgebase/StudioKnowledgeBase';

interface StudioHeaderProps {
  /** Set only with the access cookie; no Theme Agent button otherwise. */
  onToggleThemeAgent?: () => void;
  themeAgentOpen?: boolean;
  themeAgentButtonRef?: RefObject<ButtonRef | null>;
}

export function StudioHeader({
  onToggleThemeAgent,
  themeAgentOpen = false,
  themeAgentButtonRef,
}: StudioHeaderProps) {
  return (
    <header className="studio-header wa-split wa-align-items-center">
      {/* Logo and title */}
      <div className="wa-cluster wa-gap-s">
        <Link to="/" className="studio-header__back">
          <Icon name="arrow-left" />
        </Link>
        <img
          src={logoImg}
          className="studio-header__logo"
          alt="Kigumi"
          style={{ width: '24px', height: '24px' }}
        />
        <span className="wa-heading-m wa-cluster wa-gap-s">
          <span className="wa-cluster wa-gap-2xs">
            <span className="studio-header__logo-text">Kigumi</span>
            <span className="studio-header__logo-studio">Studio</span>
          </span>
          <Badge pill>
            <Icon name="tag" />
            v0.2.0
          </Badge>
        </span>
      </div>
      <div className="wa-cluster wa-gap-s">
        {onToggleThemeAgent && (
          <Button
            ref={themeAgentButtonRef}
            size="small"
            pill
            variant={themeAgentOpen ? 'brand' : 'neutral'}
            appearance={themeAgentOpen ? 'accent' : 'outlined'}
            onClick={onToggleThemeAgent}
          >
            <Icon slot="start" name="wand-magic-sparkles" />
            {themeAgentOpen ? 'Close Theme Agent' : 'Theme Agent'}
          </Button>
        )}
        <ThemeFab />
        <StudioKnowledgeBase />
      </div>
    </header>
  );
}
