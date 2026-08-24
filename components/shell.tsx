import Link from 'next/link';
import { signOut } from '@/lib/actions';
import { IconDashboard, IconClients, IconLoans, IconPayments, IconReports, IconAdmin } from '@/components/icons';

const links = [
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
