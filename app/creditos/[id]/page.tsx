import Link from 'next/link';
import { Shell, Top } from '@/components/shell';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/profile';
import { money } from '@/lib/money';
import { projectLateFee } from '@/lib/lateFees';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

const lateRuleLabel: Record<string, string> = {
  daily: 'Por día de atraso',
  per_overdue_period: 'Por periodo vencido',
  percent_overdue_balance: '% sobre saldo vencido',
};
const statusLabel: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
  partial: 'Parcial',
  overdue: 'Vencida',
  restructured: 'Reestructurada',
};
const statusBadge: Record<string, string> = {
  pending: 'pending',
  paid: 'paid',
  partial: 'pending',
  overdue: 'late',
  restructured: 'pending',
};

export default async function CreditoDetalle({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { fecha?: string };
}) {
  const supabase = createClient();
  const profile = await getCurrentProfile();
  const today = new Date().toISOString().slice(0, 10);
  const targetDate = searchParams.fecha || today;

  const [{ data: loan }, { data: installments }] = await Promise.all([
    supabase
      .from('loans')
      .select('id,folio,principal,outstanding_balance,total_due,status,tolerance_days,late_rule,late_rate,clients(full_name,phone)')
      .eq('id', params.id)
      .single(),
    supabase
      .from('installments')
      .select('id,sequence_no,due_date,principal_due,ordinary_interest_due,late_interest_due,paid_amount,status')
      .eq('loan_id', params.id)
      .order('sequence_no', { ascending: true }),
  ]);

  if (!loan) notFound();

  const rows = (installments ?? []).map((i: any) => {
    const settled = i.status === 'paid' || i.status === 'restructured';
    const projection = settled
      ? { overdueDays: 0, projectedLate: Number(i.late_interest_due), isOverdue: i.status === 'overdue' }
      : projectLateFee({
          dueDate: i.due_date,
          toleranceDays: loan.tolerance_days,
          targetDate,
          lateRule: loan.late_rule,
          lateRate: Number(loan.late_rate),
          principalDue: Number(i.principal_due),
          ordinaryInterestDue: Number(i.ordinary_interest_due),
          paidAmount: Number(i.paid_amount),
          currentLateInterestDue: Number(i.late_interest_due),
        });
    const balanceAtDate = settled
      ? 0
      : Number(i.principal_due) + Number(i.ordinary_interest_due) + projection.projectedLate - Number(i.paid_amount);
    return { ...i, ...projection, balanceAtDate, settled };
  });

  const projectedLateTotal = rows.reduce((s, r) => s + (r.settled ? 0 : r.projectedLate), 0);
  const projectedPayoffTotal = rows.reduce((s, r) => s + r.balanceAtDate, 0);
  const isHypothetical = targetDate !== today;

  return (
    <Shell active="/creditos" userName={profile?.full_name} userRole={profile?.role}>
      <Top title={`Crédito ${loan.folio}`} subtitle={(loan as any).clients?.full_name ?? ''} />

      <p className="small" style={{ marginTop: -16, marginBottom: 20 }}>
        <Link className="link" href="/creditos">← Volver a créditos</Link>
      </p>

      <div className="stat-row">
        <div className="stat-tile">
          <div><div className="stat-value">{money(Number(loan.principal))}</div><div className="stat-label">Monto original</div></div>
        </div>
        <div className="stat-tile">
          <div><div className="stat-value">{money(Number(loan.outstanding_balance))}</div><div className="stat-label">Saldo pendiente (capital)</div></div>
        </div>
        <div className="stat-tile">
          <div><div className="stat-value">{statusLabel[loan.status] ?? loan.status}</div><div className="stat-label">Estado</div></div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2>Proyectar moratorios a una fecha</h2>
        <p className="small" style={{ marginBottom: 16 }}>
          Los moratorios se calculan por día de atraso ({lateRuleLabel[loan.late_rule]}, tasa {loan.late_rate}, tolerancia {loan.tolerance_days} días) y solo se
          registran de verdad al consultar o registrar un pago con la fecha real. Usa esta herramienta para ver cuánto se acumularía a una fecha específica
          sin necesidad de cambiar la fecha del sistema — es solo una vista, no modifica ningún dato.
        </p>
        <form action={`/creditos/${loan.id}`} className="filterbar" style={{ marginBottom: isHypothetical ? 16 : 0 }}>
          <input className="input" style={{ minWidth: 180 }} type="date" name="fecha" defaultValue={targetDate} />
          <button className="button" type="submit">Calcular proyección</button>
          {isHypothetical && (
            <Link className="button" href={`/creditos/${loan.id}`} style={{ background: 'var(--ink-soft)' }}>Volver a hoy</Link>
          )}
        </form>
        {isHypothetical && (
          <p className="auth-error" style={{ display: 'inline-block' }}>
            Proyección hipotética al {new Date(targetDate + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })} — no afecta datos reales.
          </p>
        )}
        <div className="stat-row" style={{ marginTop: 16, marginBottom: 0 }}>
          <div className="stat-tile">
            <div><div className="stat-value">{money(projectedLateTotal)}</div><div className="stat-label">Moratorios proyectados</div></div>
          </div>
          <div className="stat-tile">
            <div><div className="stat-value">{money(projectedPayoffTotal)}</div><div className="stat-label">Saldo total proyectado a esa fecha</div></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Parcialidades</h2>
        </div>
        {rows.length === 0 ? (
          <p className="empty">Este crédito no tiene parcialidades generadas.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Vencimiento</th>
                <th>Capital</th>
                <th>Interés</th>
                <th>Moratorio proyectado</th>
                <th>Días de atraso</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.sequence_no}</td>
                  <td>{new Date(r.due_date + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td>{money(Number(r.principal_due))}</td>
                  <td>{money(Number(r.ordinary_interest_due))}</td>
                  <td>{money(r.projectedLate)}</td>
                  <td>{r.settled ? '—' : r.overdueDays}</td>
                  <td><span className={'badge ' + statusBadge[r.status]}>{statusLabel[r.status] ?? r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  );
}
