import { Link } from 'react-router-dom';
import logoImg from '@/assets/icon.svg';
import { ThemeFab } from './ThemeFab';

export function Header() {
  return (
    <header slot="header" className="header">
      <div className="header__content wa-split wa-gap-l wa-align-items-center">
        <div className="wa-cluster wa-gap-xs wa-align-items-center">
          <img
            src={logoImg}
            className="header__logo"
            alt="Kigumi"
            style={{ width: '24px', height: '24px' }}
          />
          <span className="wa-heading-xl header__title">Kigumi</span>
        </div>
        <div className="wa-cluster wa-gap-l wa-align-items-center">
          <a
            href={
              import.meta.env.DEV
                ? 'http://localhost:6006'
                : 'https://docs.kigumi.style'
            }
            className="wa-caption-m"
          >
            Docs
          </a>
          <Link to="/kigumi-studio" className="wa-caption-m">
            Kigumi Studio
          </Link>
          <a
            href={
              import.meta.env.DEV
                ? 'http://localhost:6006/?path=/docs/general-changelog--docs'
                : 'https://docs.kigumi.style/?path=/docs/general-changelog--docs'
            }
            className="wa-caption-m header__changelog"
          >
            Changelog
          </a>
          <ThemeFab />
        </div>
      </div>
    </header>
  );
}
