import Link from 'next/link';
import { Shell, Top } from '@/components/shell';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/profile';
import { createLoanAction } from '@/lib/actions';
import { money } from '@/lib/money';
import { IconLoans, IconCheck, IconAlert, IconInbox } from '@/components/icons';

const statusLabel: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activo',
  paid_off: 'Liquidado',
  cancelled: 'Cancelado',
  restructured: 'Reestructurado',
};
export const dynamic = 'force-dynamic';

const statusBadge: Record<string, string> = {
  draft: 'pending',
  active: 'paid',
  paid_off: 'paid',
  cancelled: 'late',
  restructured: 'pending',
};

export default async function Creditos({ searchParams }: { searchParams: { nuevo?: string; error?: string } }) {
  const supabase = createClient();
  const profile = await getCurrentProfile();

  const [{ data: loans }, { data: clients }] = await Promise.all([
    supabase
      .from('loans')
      .select('id,folio,principal,outstanding_balance,status,clients(full_name)')
      .order('created_at', { ascending: false }),
    supabase.from('clients').select('id,full_name').eq('active', true).order('full_name'),
  ]);

  const activeLoans = loans?.filter((l) => l.status === 'active').length ?? 0;
  const paidOff = loans?.filter((l) => l.status === 'paid_off').length ?? 0;
  const placedTotal = (loans ?? []).reduce((s, l) => s + Number(l.principal), 0);

  return (
    <Shell active="/creditos" userName={profile?.full_name} userRole={profile?.role}>
      <Top title="Créditos" subtitle="Otorga y da seguimiento a los préstamos de tu cartera" />

      <div className="stat-row">
        <div className="stat-tile">
          <span className="stat-icon"><IconLoans size={20} /></span>
          <div><div className="stat-value">{activeLoans}</div><div className="stat-label">Créditos activos</div></div>
        </div>
        <div className="stat-tile">
          <span className="stat-icon"><IconCheck size={20} /></span>
          <div><div className="stat-value">{paidOff}</div><div className="stat-label">Liquidados</div></div>
        </div>
        <div className="stat-tile">
          <span className="stat-icon"><IconAlert size={20} /></span>
          <div><div className="stat-value">{money(placedTotal)}</div><div className="stat-label">Cartera colocada</div></div>
        </div>
      </div>

      {(searchParams.nuevo || searchParams.error) && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2>Otorgar crédito</h2>
          {searchParams.error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{searchParams.error}</p>}
          <form action={createLoanAction} className="form-grid">
            <label className="field">Cliente
              <select name="client_id" required>
                <option value="">Selecciona un cliente</option>
                {clients?.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </label>
            <label className="field">Monto del crédito<input className="input" name="principal" type="number" step="0.01" min="1" required /></label>
            <label className="field">Fecha de dispersión<input className="input" name="disbursed_at" type="date" required /></label>
            <label className="field">Primer pago<input className="input" name="first_payment_at" type="date" required /></label>
            <label className="field">Frecuencia
              <select name="frequency" required>
                <option value="weekly">Semanal</option>
                <option value="biweekly">Quincenal</option>
                <option value="monthly">Mensual</option>
                <option value="custom">Personalizada (días)</option>
              </select>
            </label>
            <label className="field">Días personalizados<input className="input" name="custom_days" type="number" min="1" /></label>
            <label className="field"># de parcialidades<input className="input" name="installments_count" type="number" min="1" required /></label>
            <label className="field">Tipo de interés
              <select name="interest_type" required>
                <option value="simple">Simple</option>
                <option value="declining_balance">Sobre saldo insoluto</option>
              </select>
            </label>
            <label className="field">Tasa anual (%)<input className="input" name="annual_interest_rate" type="number" step="0.01" defaultValue={36} required /></label>
            <label className="field">Días de tolerancia<input className="input" name="tolerance_days" type="number" defaultValue={3} /></label>
            <label className="field">Regla de moratorios
              <select name="late_rule">
                <option value="daily">Por día de atraso</option>
                <option value="per_overdue_period">Por periodo vencido</option>
                <option value="percent_overdue_balance">% sobre saldo vencido</option>
              </select>
            </label>
            <label className="field">Tasa de moratorio<input className="input" name="late_rate" type="number" step="0.01" defaultValue={0} /></label>
            <div className="span2"><button className="button" type="submit">Otorgar crédito</button></div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <h2>Créditos registrados</h2>
          <a className="button" href="/creditos?nuevo=1">+ Otorgar crédito</a>
        </div>
        {!loans || loans.length === 0 ? (
          <div className="empty">
            <span className="empty-icon"><IconInbox size={24} /></span>
            <strong>Aún no hay créditos otorgados</strong>
            <span>Otorga tu primer crédito para generar la tabla de amortización y empezar a dar seguimiento.</span>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Folio</th><th>Cliente</th><th>Monto original</th><th>Saldo pendiente</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {loans.map((l: any) => (
                <tr key={l.id}>
                  <td><Link className="link" href={`/creditos/${l.id}`}><strong>{l.folio}</strong></Link></td>
                  <td>{l.clients?.full_name}</td>
                  <td>{money(Number(l.principal))}</td>
                  <td>{money(Number(l.outstanding_balance))}</td>
                  <td><span className={'badge ' + statusBadge[l.status]}>{statusLabel[l.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  );
}
