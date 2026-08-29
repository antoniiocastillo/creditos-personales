import Link from 'next/link';
import { Shell, Top } from '@/components/shell';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/profile';
import { money } from '@/lib/money';
import { projectLateFee } from '@/lib/lateFees';
import { updateLoanAction, cancelLoanAction } from '@/lib/actions';
import { FrequencyAndRateFields } from '@/components/frequency-rate-fields';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

const lateRuleLabel: Record<string, string> = {
  daily: 'Por día de atraso',
  per_overdue_period: 'Por periodo vencido',
  percent_overdue_balance: '% sobre saldo vencido',
};
const loanStatusLabel: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activo',
  paid_off: 'Liquidado',
  cancelled: 'Cancelado',
  restructured: 'Reestructurado',
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
  searchParams: { fecha?: string; editar?: string; error?: string };
}) {
  const supabase = createClient();
  const profile = await getCurrentProfile();
  const today = new Date().toISOString().slice(0, 10);
  const targetDate = searchParams.fecha || today;

  const [{ data: loan }, { data: installments }, { count: paymentsCount }, { data: clients }] = await Promise.all([
    supabase
      .from('loans')
      .select(
        'id,folio,client_id,principal,outstanding_balance,total_due,status,disbursed_at,first_payment_at,frequency,custom_days,installments_count,interest_type,annual_interest_rate,tolerance_days,late_rule,late_rate,clients(full_name,phone)',
      )
      .eq('id', params.id)
      .single(),
    supabase
      .from('installments')
      .select('id,sequence_no,due_date,principal_due,ordinary_interest_due,late_interest_due,paid_amount,status')
      .eq('loan_id', params.id)
      .order('sequence_no', { ascending: true }),
    supabase.from('payments').select('id', { count: 'exact', head: true }).eq('loan_id', params.id),
    supabase.from('clients').select('id,full_name').eq('active', true).order('full_name'),
  ]);

  if (!loan) notFound();

  const hasBalance = Number(loan.outstanding_balance) > 0;
  const canEdit = (paymentsCount ?? 0) === 0 && (loan.status === 'active' || loan.status === 'draft');

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: -16, marginBottom: 20 }}>
        <Link className="link" href="/creditos">← Volver a créditos</Link>
        <div style={{ display: 'flex', gap: 10 }}>
          {canEdit && (
            <Link className="button" href={searchParams.editar ? `/creditos/${loan.id}` : `/creditos/${loan.id}?editar=1`} style={{ background: 'var(--ink-soft)' }}>
              {searchParams.editar ? 'Cancelar edición' : 'Editar crédito'}
            </Link>
          )}
          <a className="button" href={`/creditos/${loan.id}/pagare`} style={{ background: 'var(--ink-soft)' }}>Descargar pagaré (PDF)</a>
          <a className="button" href={`/creditos/${loan.id}/estado-cuenta`}>Descargar estado de cuenta (PDF)</a>
        </div>
      </div>

      {searchParams.error && <p className="auth-error" style={{ display: 'inline-block', marginBottom: 16 }}>{searchParams.error}</p>}

      {!canEdit && (loan.status === 'active' || loan.status === 'draft') && (paymentsCount ?? 0) > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          {hasBalance ? (
            <p className="small" style={{ margin: 0 }}>
              Este crédito ya tiene {paymentsCount} pago{paymentsCount === 1 ? '' : 's'} registrado{paymentsCount === 1 ? '' : 's'} y todavía debe{' '}
              <strong>{money(Number(loan.outstanding_balance))}</strong> de saldo, así que no se puede editar ni cancelar — cancelarlo con saldo pendiente
              haría que el sistema deje de darle seguimiento a esa deuda real. Sigue registrando sus pagos normalmente hasta liquidarlo.
            </p>
          ) : (
            <>
              <p className="small" style={{ marginBottom: 12 }}>
                Este crédito ya tiene {paymentsCount} pago{paymentsCount === 1 ? '' : 's'} registrado{paymentsCount === 1 ? '' : 's'}, así que ya no se puede
                editar para no corromper el historial. Ya no tiene saldo pendiente, así que si necesitas darlo de baja puedes cancelarlo.
              </p>
              <form action={cancelLoanAction}>
                <input type="hidden" name="id" value={loan.id} />
                <button className="button" type="submit" style={{ background: 'var(--red)' }}>Cancelar este crédito</button>
              </form>
            </>
          )}
        </div>
      )}

      {canEdit && searchParams.editar && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2>Editar crédito</h2>
          <form action={updateLoanAction} className="form-grid">
            <input type="hidden" name="id" value={loan.id} />
            <label className="field">Cliente
              <select name="client_id" defaultValue={loan.client_id} required>
                {clients?.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </label>
            <label className="field">Monto del crédito<input className="input" name="principal" type="number" step="0.01" min="1" defaultValue={Number(loan.principal)} required /></label>
            <label className="field">Fecha de dispersión<input className="input" name="disbursed_at" type="date" defaultValue={loan.disbursed_at} required /></label>
            <label className="field">Primer pago<input className="input" name="first_payment_at" type="date" defaultValue={loan.first_payment_at} required /></label>
            <FrequencyAndRateFields defaultFrequency={loan.frequency} defaultRate={Number(loan.annual_interest_rate)} />
            <label className="field">Días personalizados<input className="input" name="custom_days" type="number" min="1" defaultValue={loan.custom_days || ''} /></label>
            <label className="field"># de parcialidades<input className="input" name="installments_count" type="number" min="1" defaultValue={loan.installments_count} required /></label>
            <label className="field">Tipo de interés
              <select name="interest_type" defaultValue={loan.interest_type} required>
                <option value="simple">Simple</option>
                <option value="declining_balance">Sobre saldo insoluto</option>
              </select>
            </label>
            <label className="field">Días de tolerancia<input className="input" name="tolerance_days" type="number" defaultValue={loan.tolerance_days} /></label>
            <label className="field">Regla de moratorios
              <select name="late_rule" defaultValue={loan.late_rule}>
                <option value="daily">Por día de atraso</option>
                <option value="per_overdue_period">Por periodo vencido</option>
                <option value="percent_overdue_balance">% sobre saldo vencido</option>
              </select>
            </label>
            <label className="field">Tasa de moratorio<input className="input" name="late_rate" type="number" step="0.01" defaultValue={Number(loan.late_rate)} /></label>
            <p className="small span2">Al guardar se recalcula la tabla de amortización completa con estos nuevos datos.</p>
            <div className="span2"><button className="button" type="submit">Guardar cambios</button></div>
          </form>
        </div>
      )}

      <div className="stat-row">
        <div className="stat-tile">
          <div><div className="stat-value">{money(Number(loan.principal))}</div><div className="stat-label">Monto original</div></div>
        </div>
        <div className="stat-tile">
          <div><div className="stat-value">{money(Number(loan.outstanding_balance))}</div><div className="stat-label">Saldo pendiente (capital)</div></div>
        </div>
        <div className="stat-tile">
          <div><div className="stat-value">{loanStatusLabel[loan.status] ?? loan.status}</div><div className="stat-label">Estado</div></div>
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
