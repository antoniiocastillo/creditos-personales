import Link from 'next/link';
import { signOut } from '@/lib/actions';
import { createClient } from '@/lib/supabase/server';
import { NotificationsBell, type OverdueItem } from '@/components/notifications-bell';
import { IconDashboard, IconClients, IconLoans, IconPayments, IconReports, IconAdmin, IconLogout } from '@/components/icons';

const links = [
  { href: '/', label: 'Dashboard', Icon: IconDashboard },
  { href: '/clientes', label: 'Clientes', Icon: IconClients },
  { href: '/creditos', label: 'Créditos', Icon: IconLoans },
  { href: '/pagos', label: 'Pagos', Icon: IconPayments },
  { href: '/reportes', label: 'Reportes', Icon: IconReports },
  { href: '/administracion', label: 'Administración', Icon: IconAdmin },
];

async function getOverdueNotifications(): Promise<{ items: OverdueItem[]; totalCount: number }> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data }, { count }] = await Promise.all([
    supabase
      .from('installments')
      .select('loan_id,due_date,principal_due,ordinary_interest_due,late_interest_due,paid_amount,loans(folio,clients(full_name))')
      .not('status', 'in', '(paid,restructured)')
      .lt('due_date', today)
      .order('due_date', { ascending: true })
      .limit(8),
    supabase
      .from('installments')
      .select('id', { count: 'exact', head: true })
      .not('status', 'in', '(paid,restructured)')
      .lt('due_date', today),
  ]);

  const items: OverdueItem[] = (data ?? []).map((i: any) => ({
    loanId: i.loan_id,
    folio: i.loans?.folio ?? '',
    clientName: i.loans?.clients?.full_name ?? '',
    dueDate: i.due_date,
    amount: Number(i.principal_due) + Number(i.ordinary_interest_due) + Number(i.late_interest_due) - Number(i.paid_amount),
  }));

  return { items, totalCount: count ?? 0 };
}

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

export async function Top({ title, subtitle }: { title: string; subtitle: string }) {
  const { items, totalCount } = await getOverdueNotifications();
  return (
    <header className="top">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <NotificationsBell items={items} totalCount={totalCount} />
    </header>
  );
}
