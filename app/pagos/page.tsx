import { Shell, Top } from '@/components/shell';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/profile';
import { registerPaymentAction } from '@/lib/actions';
import { money } from '@/lib/money';

export const dynamic = 'force-dynamic';

const methodLabel: Record<string, string> = { cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta', other: 'Otro' };

export default async function Pagos({ searchParams }: { searchParams: { nuevo?: string; error?: string } }) {
  const supabase = createClient();
  const profile = await getCurrentProfile();

  const [{ data: payments }, { data: loans }] = await Promise.all([
    supabase
      .from('payments')
      .select('id,paid_at,amount,method,loans(folio),clients(full_name)')
      .order('paid_at', { ascending: false })
      .limit(20),
    supabase
      .from('loans')
      .select('id,folio,clients(full_name)')
      .eq('status', 'active')
      .order('folio'),
  ]);

  return (
    <Shell>
      <Top title="Pagos" subtitle="Registra y consulta pagos de créditos" userName={profile?.full_name} userRole={profile?.role} />

      {searchParams.nuevo && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2>Registrar pago</h2>
          {searchParams.error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{searchParams.error}</p>}
          <form action={registerPaymentAction} className="form-grid">
            <label className="field">Crédito
              <select name="loan_id" required>
                <option value="">Selecciona un crédito</option>
                {loans?.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.folio} · {l.clients?.full_name}</option>
                ))}
              </select>
            </label>
            <label className="field">Monto<input className="input" name="amount" type="number" step="0.01" min="0.01" required /></label>
            <label className="field">Método
              <select name="method" required>
                <option value="cash">Efectivo</option>
                <option value="transfer">Transferencia</option>
                <option value="card">Tarjeta</option>
                <option value="other">Otro</option>
              </select>
            </label>
            <label className="field">Referencia<input className="input" name="reference" /></label>
            <label className="field span2">Notas<textarea name="notes" /></label>
            <div className="span2"><button className="button" type="submit">Registrar pago</button></div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <h2>Registro de pagos</h2>
          <a className="button" href="/pagos?nuevo=1">+ Registrar pago</a>
        </div>
        <p className="small">Al registrar un pago, el sistema aplica primero moratorios, después intereses y finalmente capital.</p>
        {!payments || payments.length === 0 ? (
          <p className="empty">Sin pagos registrados todavía.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Fecha</th><th>Crédito</th><th>Cliente</th><th>Monto</th><th>Método</th></tr>
            </thead>
            <tbody>
              {payments.map((p: any) => (
                <tr key={p.id}>
                  <td>{new Date(p.paid_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td>{p.loans?.folio}</td>
                  <td>{p.clients?.full_name}</td>
                  <td><strong>{money(Number(p.amount))}</strong></td>
                  <td>{methodLabel[p.method]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  );
}
