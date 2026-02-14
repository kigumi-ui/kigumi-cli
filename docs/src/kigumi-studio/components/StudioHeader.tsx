import { Link } from 'react-router-dom';
import { Button, Icon, ButtonGroup, Badge } from '@/components/ui';
import { useStudio } from '../contexts/StudioContext';
import { ThemeFab } from '@/components/landing/ThemeFab';
import logoImg from '@/assets/icon.svg';
import './StudioHeader.css';

export function StudioHeader() {
  const { editMode, setEditMode, previewMode, setPreviewMode } = useStudio();

  return (
    <header className="studio-header wa-flank wa-align-items-center">
      <div className="wa-gap-2xl wa-cluster">
        <div className="wa-cluster wa-gap-xs">
          <Link to="/" className="studio-header__back">
            <Icon name="arrow-left" />
          </Link>
          <img
            src={logoImg}
            className="studio-header__logo"
            alt="Kigumi"
            style={{ width: '24px', height: '24px' }}
          />
          <span className="wa-heading-m studio-header__title wa-cluster wa-gap-2xs">
            <span className="studio-header__logo-text">Kigumi</span>
            <span className="studio-header__logo-studio">Studio</span>
          </span>
          <Badge pill>Alpha</Badge>
        </div>

        <div className="wa-gap-m">
          <div className="wa-stack wa-gap-2xs">
            <span className="wa-caption-s">Design Tokens</span>
            <ButtonGroup>
              <Button
                size="small"
                variant={editMode === 'light' ? 'brand' : 'neutral'}
                appearance={editMode === 'light' ? 'accent' : 'outlined'}
                onClick={() => setEditMode('light')}
              >
                <Icon name="sun" label="Light" />
              </Button>
              <Button
                size="small"
                variant={editMode === 'dark' ? 'brand' : 'neutral'}
                appearance={editMode === 'dark' ? 'accent' : 'outlined'}
                onClick={() => setEditMode('dark')}
              >
                <Icon name="moon" label="Dark" />
              </Button>
            </ButtonGroup>
          </div>

          <div className="wa-stack wa-gap-2xs">
            <span className="wa-caption-s">Preview</span>
            <ButtonGroup>
              <Button
                size="small"
                variant={previewMode === 'light' ? 'brand' : 'neutral'}
                appearance={previewMode === 'light' ? 'accent' : 'outlined'}
                onClick={() => setPreviewMode('light')}
              >
                <Icon name="sun" label="Light" />
              </Button>
              <Button
                size="small"
                variant={previewMode === 'dark' ? 'brand' : 'neutral'}
                appearance={previewMode === 'dark' ? 'accent' : 'outlined'}
                onClick={() => setPreviewMode('dark')}
              >
                <Icon name="moon" label="Dark" />
              </Button>
            </ButtonGroup>
          </div>
        </div>
      </div>
      <ThemeFab />
    </header>
  );
}
