import { Link } from 'react-router-dom';
import { Icon, Badge } from '@/components/ui';
import { ThemeFab } from '@/components/landing/ThemeFab';
import logoImg from '@/assets/icon.svg';
import './StudioHeader.css';
import { StudioKnowledgeBase } from './knowledgebase/StudioKnowledgeBase';

export function StudioHeader() {
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
          <Badge pill>Beta</Badge>
        </span>
      </div>
      <div className="wa-cluster wa-gap-s">
        <ThemeFab />
        <StudioKnowledgeBase />
      </div>
    </header>
  );
}
