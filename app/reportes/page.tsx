import { Shell, Top } from '@/components/shell';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/profile';
import { money } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function Reportes() {
  const supabase = createClient();
  const profile = await getCurrentProfile();
  const today = new Date().toISOString().slice(0, 10);

  const [loans, payments, overdue, paidOff] = await Promise.all([
    supabase.from('loans').select('principal', { count: 'exact' }),
    supabase.from('payments').select('amount'),
    supabase
      .from('installments')
      .select('principal_due,ordinary_interest_due,late_interest_due,paid_amount')
      .not('status', 'in', '(paid,restructured)')
      .lt('due_date', today),
    supabase.from('loans').select('id', { count: 'exact', head: true }).eq('status', 'paid_off'),
  ]);

  const placed = (loans.data ?? []).reduce((s, l: any) => s + Number(l.principal), 0);
  const recovered = (payments.data ?? []).reduce((s, p: any) => s + Number(p.amount), 0);
  const overdueTotal = (overdue.data ?? []).reduce(
    (s, i: any) => s + Number(i.principal_due) + Number(i.ordinary_interest_due) + Number(i.late_interest_due) - Number(i.paid_amount),
    0,
  );

  return (
    <Shell active="/reportes">
      <Top title="Reportes" subtitle="Información de cartera y cobranza" userName={profile?.full_name} userRole={profile?.role} />
      <div className="kpis">
        {[
          ['Cartera colocada', money(placed)],
          ['Recuperado', money(recovered)],
          ['Vencido', money(overdueTotal)],
          ['Créditos liquidados', String(paidOff.count ?? 0)],
        ].map(([l, v]) => (
          <div className="card" key={l}>
            <div className="kpi-label">{l}</div>
            <div className="kpi-value">{v}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <h2>Reportes disponibles</h2>
        <div className="due">
          <div className="due-item">
            <div><strong>Cartera por antigüedad</strong><div className="small">Saldos agrupados por días de atraso</div></div>
            <a className="button" href="/reportes/export?type=antiguedad">Exportar</a>
          </div>
          <div className="due-item">
            <div><strong>Pagos por periodo</strong><div className="small">Pagos recibidos por fecha y operador</div></div>
            <a className="button" href="/reportes/export?type=pagos">Exportar</a>
          </div>
          <div className="due-item">
            <div><strong>Estado de cuenta por cliente</strong><div className="small">Historial de créditos, cargos y pagos</div></div>
            <a className="button" href="/reportes/export?type=clientes">Exportar</a>
          </div>
        </div>
      </div>
    </Shell>
  );
}
