import Link from 'next/link';
import { signOut } from '@/lib/actions';
import { IconDashboard, IconClients, IconLoans, IconPayments, IconReports, IconAdmin, IconLogout } from '@/components/icons';

const links = [
  { href: '/', label: 'Dashboard', Icon: IconDashboard },
  { href: '/clientes', label: 'Clientes', Icon: IconClients },
  { href: '/creditos', label: 'Créditos', Icon: IconLoans },
  { href: '/pagos', label: 'Pagos', Icon: IconPayments },
  { href: '/reportes', label: 'Reportes', Icon: IconReports },
  { href: '/administracion', label: 'Administración', Icon: IconAdmin },
];

export function Shell({
  children,
  active = '/',
  userName,
  userRole,
}: {
  children: React.ReactNode;
  active?: string;
  userName?: string;
  userRole?: string;
}) {
  const initials = (userName || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <span className="logo">C</span>
          <div>
            <div className="brand-name">Crédito Fácil</div>
            <div className="brand-sub">Gestión de créditos</div>
          </div>
        </div>
        <nav className="nav">
          {links.map(({ href, label, Icon }) => (
            <Link key={href} href={href} className={href === active ? 'active' : ''} title={label} aria-label={label}>
              <Icon />
              <span className="nav-label">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="side-user">
          <span className="avatar">{initials || '?'}</span>
          <div className="side-user-info">
            <strong>{userName || 'Usuario'}</strong>
            <span>{userRole === 'admin' ? 'Administrador' : 'Operador'}</span>
          </div>
          <form action={signOut}>
            <button className="icon-button" type="submit" title="Salir">
              <IconLogout size={16} />
            </button>
          </form>
        </div>
      </aside>
      <main className="page">{children}</main>
    </div>
  );
}

export function Top({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="top">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </header>
  );
}
