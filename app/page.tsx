import { Shell, Top } from '@/components/shell';
import { money } from '@/lib/money';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/profile';

export default async function Dashboard() {
  const supabase = createClient();
  const profile = await getCurrentProfile();
  const today = new Date().toISOString().slice(0, 10);

  const [activeLoans, overdueInstallments, upcomingInstallments] = await Promise.all([
    supabase.from('loans').select('principal,outstanding_balance').eq('status', 'active'),
    supabase
      .from('installments')
      .select('id,due_date,principal_due,ordinary_interest_due,late_interest_due,paid_amount,loans(folio,clients(full_name))')
      .not('status', 'in', '(paid,restructured)')
      .lt('due_date', today)
      .order('due_date', { ascending: true })
      .limit(5),
    supabase
      .from('installments')
      .select('id,due_date,principal_due,ordinary_interest_due,loans(folio,clients(full_name))')
      .eq('status', 'pending')
      .gte('due_date', today)
      .order('due_date', { ascending: true })
      .limit(5),
  ]);

  const loans = activeLoans.data ?? [];
  const activeCount = loans.length;
  const placedTotal = loans.reduce((s, l) => s + Number(l.principal), 0);
  const outstandingTotal = loans.reduce((s, l) => s + Number(l.outstanding_balance), 0);

  const overdue = overdueInstallments.data ?? [];
  const overdueDue = overdue.reduce(
    (s, i) => s + Number(i.principal_due) + Number(i.ordinary_interest_due) + Number(i.late_interest_due) - Number(i.paid_amount),
    0,
  );
  const lateAccrued = overdue.reduce((s, i) => s + Number(i.late_interest_due), 0);

  const upcoming = upcomingInstallments.data ?? [];

  const fmtDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });

  return (
    <Shell>
      <Top
        title="Dashboard"
        subtitle={`Resumen de la cartera al ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}`}
        userName={profile?.full_name}
        userRole={profile?.role}
      />
      <section className="kpis">
        {[
          ['Créditos activos', String(activeCount), money(placedTotal)],
          ['Saldo por recuperar', money(outstandingTotal), `${placedTotal ? Math.round((outstandingTotal / placedTotal) * 100) : 0}% de cartera`],
          ['Pagos vencidos', money(overdueDue), `${overdue.length} pagos pendientes`, 'late'],
          ['Moratorios acumulados', money(lateAccrued), 'Actualizado hoy'],
        ].map(([l, v, d, c]) => (
          <div className="card" key={l}>
            <div className="kpi-label">{l}</div>
            <div className="kpi-value">{v}</div>
            <div className={c || 'delta'}>{d}</div>
          </div>
        ))}
      </section>
      <section className="grid">
        <div className="card">
          <div className="card-head">
            <h2>Pagos con atención requerida</h2>
            <a className="link" href="/pagos">Ver todos</a>
          </div>
          {overdue.length === 0 ? (
            <p className="empty">No hay pagos vencidos.</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Crédito</th><th>Cliente</th><th>Vencimiento</th><th>Importe</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {overdue.map((i: any) => (
                  <tr key={i.id}>
                    <td><strong>{i.loans?.folio}</strong></td>
                    <td>{i.loans?.clients?.full_name}</td>
                    <td>{fmtDate(i.due_date)}</td>
                    <td>{money(Number(i.principal_due) + Number(i.ordinary_interest_due) + Number(i.late_interest_due) - Number(i.paid_amount))}</td>
                    <td><span className="badge late">Vencido</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card">
          <div className="card-head">
            <h2>Próximos vencimientos</h2>
            <span className="link">14 días</span>
          </div>
          {upcoming.length === 0 ? (
            <p className="empty">Sin vencimientos próximos.</p>
          ) : (
            <div className="due">
              {upcoming.map((i: any) => (
                <div className="due-item" key={i.id}>
                  <div>
                    <strong><span className="dot" />{i.loans?.clients?.full_name}</strong>
                    <div className="small">{fmtDate(i.due_date)} · {i.loans?.folio}</div>
                  </div>
                  <strong>{money(Number(i.principal_due) + Number(i.ordinary_interest_due))}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Shell>
  );
}
