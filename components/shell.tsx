import Link from 'next/link';
import { signOut } from '@/lib/actions';

type IconProps = { size?: number };

const iconProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

const IconDashboard = ({ size = 18 }: IconProps) => (
  <svg {...iconProps(size)}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
);
const IconClients = ({ size = 18 }: IconProps) => (
  <svg {...iconProps(size)}><circle cx="9" cy="8" r="3.25" /><path d="M3.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6" /><circle cx="17" cy="8.5" r="2.5" /><path d="M15.7 14.2c2.6.4 4.5 2.7 4.8 5.8" /></svg>
);
const IconLoans = ({ size = 18 }: IconProps) => (
  <svg {...iconProps(size)}><rect x="2.5" y="5" width="19" height="14" rx="2.2" /><path d="M2.5 9.5h19" /><path d="M6 14.5h5" /></svg>
);
const IconPayments = ({ size = 18 }: IconProps) => (
  <svg {...iconProps(size)}><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9v.01M18 15v.01" /></svg>
);
const IconReports = ({ size = 18 }: IconProps) => (
  <svg {...iconProps(size)}><path d="M4 20V10M11 20V4M18 20v-7" /><path d="M2.5 20h19" /></svg>
);
const IconAdmin = ({ size = 18 }: IconProps) => (
  <svg {...iconProps(size)}><circle cx="12" cy="12" r="3" /><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.4-2-3.4-2.3.9a7.7 7.7 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.6a7.7 7.7 0 0 0-2.6 1.5l-2.3-.9-2 3.4 2 1.4a7.6 7.6 0 0 0 0 3l-2 1.4 2 3.4 2.3-.9c.76.66 1.64 1.17 2.6 1.5l.5 2.6h4l.5-2.6a7.7 7.7 0 0 0 2.6-1.5l2.3.9 2-3.4-2-1.4Z" /></svg>
);

const links: { href: string; label: string; Icon: (p: IconProps) => JSX.Element }[] = [
  { href: '/', label: 'Dashboard', Icon: IconDashboard },
  { href: '/clientes', label: 'Clientes', Icon: IconClients },
  { href: '/creditos', label: 'Créditos', Icon: IconLoans },
  { href: '/pagos', label: 'Pagos', Icon: IconPayments },
  { href: '/reportes', label: 'Reportes', Icon: IconReports },
  { href: '/administracion', label: 'Administración', Icon: IconAdmin },
];

export function Shell({ children, active = '/' }: { children: React.ReactNode; active?: string }) {
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <span className="logo">C</span>
          Crédito Fácil
        </div>
        <nav className="nav">
          {links.map(({ href, label, Icon }) => (
            <Link key={href} href={href} className={href === active ? 'active' : ''}>
              <Icon />
              {label}
            </Link>
          ))}
        </nav>
        <div className="side-foot">v1.0 · Gestión de créditos</div>
      </aside>
      <main className="page">{children}</main>
    </div>
  );
}

export function Top({ title, subtitle, userName, userRole }: { title: string; subtitle: string; userName?: string; userRole?: string }) {
  const initials = (userName || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <header className="top">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="user">
        <span className="avatar">{initials || '?'}</span>
        <span>
          {userName || 'Usuario'}
          <br />
          <small>{userRole === 'admin' ? 'Acceso completo' : 'Operador'}</small>
        </span>
        <form action={signOut}>
          <button className="link" type="submit" style={{ background: 'none', border: 0, cursor: 'pointer', font: 'inherit' }}>
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}
