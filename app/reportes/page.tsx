import { Shell, Top } from '@/components/shell';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/profile';
import { money } from '@/lib/money';
import { methodLabel } from '@/lib/labels';

export const dynamic = 'force-dynamic';

const AGING_BUCKETS = [
  { key: '1-7', label: '1 a 7 días', max: 7 },
  { key: '8-15', label: '8 a 15 días', max: 15 },
  { key: '16-30', label: '16 a 30 días', max: 30 },
  { key: '31+', label: 'Más de 30 días', max: Infinity },
];

const METHOD_COLOR: Record<string, string> = {
  cash: 'var(--accent)',
  transfer: 'var(--green)',
  card: 'var(--amber)',
  other: 'var(--muted)',
};

export default async function Reportes() {
  const supabase = createClient();
  const profile = await getCurrentProfile();
  const today = new Date().toISOString().slice(0, 10);

  const [loans, payments, overdue, paidOff] = await Promise.all([
    supabase.from('loans').select('principal', { count: 'exact' }),
    supabase.from('payments').select('amount,method'),
    supabase
      .from('installments')
      .select('due_date,principal_due,ordinary_interest_due,late_interest_due,paid_amount')
      .not('status', 'in', '(paid,restructured)')
      .lt('due_date', today),
    supabase.from('loans').select('id', { count: 'exact', head: true }).eq('status', 'paid_off'),
  ]);

  const placed = (loans.data ?? []).reduce((s, l: any) => s + Number(l.principal), 0);
  const recovered = (payments.data ?? []).reduce((s, p: any) => s + Number(p.amount), 0);
  const overdueRows = overdue.data ?? [];
  const overdueTotal = overdueRows.reduce(
    (s, i: any) => s + Number(i.principal_due) + Number(i.ordinary_interest_due) + Number(i.late_interest_due) - Number(i.paid_amount),
    0,
  );
  const recoveryRate = placed > 0 ? Math.min(100, (recovered / placed) * 100) : 0;

  const aging = AGING_BUCKETS.map((b) => ({ ...b, total: 0 }));
  overdueRows.forEach((i: any) => {
    const days = Math.floor((Date.now() - new Date(i.due_date).getTime()) / 86400000);
    const amount = Number(i.principal_due) + Number(i.ordinary_interest_due) + Number(i.late_interest_due) - Number(i.paid_amount);
    const bucket = aging.find((b) => days <= b.max) ?? aging[aging.length - 1];
    bucket.total += amount;
  });
  const agingMax = Math.max(1, ...aging.map((b) => b.total));

  const methodTotals: Record<string, number> = {};
  (payments.data ?? []).forEach((p: any) => {
    methodTotals[p.method] = (methodTotals[p.method] ?? 0) + Number(p.amount);
  });
  const methodEntries = Object.entries(methodTotals).sort((a, b) => b[1] - a[1]);
  const methodMax = Math.max(1, ...methodEntries.map(([, v]) => v));

  return (
    <Shell active="/reportes" userName={profile?.full_name} userRole={profile?.role}>
      <Top title="Reportes" subtitle="Información de cartera y cobranza" />
      <div className="kpis">
        {[
          ['Cartera colocada', money(placed)],
          ['Recuperado', money(recovered)],
          ['Vencido', money(overdueTotal)],
          ['Tasa de recuperación', `${recoveryRate.toFixed(0)}%`],
        ].map(([l, v]) => (
          <div className="card" key={l}>
            <div className="kpi-label">{l}</div>
            <div className="kpi-value">{v}</div>
          </div>
        ))}
      </div>

      <div className="grid">
        <div className="card">
          <div className="card-head">
            <h2>Cartera vencida por antigüedad</h2>
            <a className="link" href="/reportes/export?type=antiguedad">Exportar CSV</a>
          </div>
          {overdueTotal === 0 ? (
            <p className="empty-note">No hay saldos vencidos en este momento.</p>
          ) : (
            <div className="bars">
              {aging.map((b) => (
                <div className="bar-row" key={b.key}>
                  <div className="bar-row-head">
                    <strong>{b.label}</strong>
                    <span>{money(b.total)}</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${(b.total / agingMax) * 100}%`, background: b.key === '31+' ? 'var(--red)' : b.key === '16-30' ? 'var(--amber)' : 'var(--accent)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Cobranza por método de pago</h2>
            <a className="link" href="/reportes/export?type=pagos">Exportar CSV</a>
          </div>
          {methodEntries.length === 0 ? (
            <p className="empty-note">Todavía no hay pagos registrados.</p>
          ) : (
            <div className="legend">
              {methodEntries.map(([method, total]) => (
                <div className="legend-item" key={method}>
                  <span className="dot" style={{ background: METHOD_COLOR[method] ?? 'var(--muted)' }} />
                  <span className="legend-label">{methodLabel[method] ?? method}</span>
                  <div className="bar-track" style={{ flex: 2 }}>
                    <div className="bar-fill" style={{ width: `${(total / methodMax) * 100}%`, background: METHOD_COLOR[method] ?? 'var(--muted)' }} />
                  </div>
                  <span className="legend-value">{money(total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
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
