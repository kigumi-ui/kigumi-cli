import logoImg from '@/assets/icon.svg';

export function Header() {
  return (
    <header slot="header" className="header">
      <div className="wa-cluster wa-gap-xs logo">
        <img
          src={logoImg}
          className="brand-logo"
          alt="Kigumi"
          style={{ width: '24px', height: '24px' }}
        />
        <span className="wa-heading-xl brand-text">Kigumi</span>
      </div>
    </header>
  );
}
