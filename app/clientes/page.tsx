import { Shell, Top } from '@/components/shell';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/profile';
import { createClientAction } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function Clientes({ searchParams }: { searchParams: { q?: string; nuevo?: string; error?: string } }) {
  const supabase = createClient();
  const profile = await getCurrentProfile();

  let query = supabase
    .from('clients')
    .select('id,full_name,phone,email,active,loans(id)')
    .order('full_name', { ascending: true });
  if (searchParams.q) {
    query = query.or(`full_name.ilike.%${searchParams.q}%,phone.ilike.%${searchParams.q}%,identification.ilike.%${searchParams.q}%`);
  }
  const { data: clients } = await query;

  return (
    <Shell>
      <Top title="Clientes" subtitle="Consulta y administra la información de tus clientes" userName={profile?.full_name} userRole={profile?.role} />

      {searchParams.nuevo && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2>Nuevo cliente</h2>
          {searchParams.error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{searchParams.error}</p>}
          <form action={createClientAction} className="form-grid">
            <label className="field">Nombre completo<input className="input" name="full_name" required /></label>
            <label className="field">Teléfono<input className="input" name="phone" required /></label>
            <label className="field">Correo<input className="input" name="email" type="email" /></label>
            <label className="field">Identificación<input className="input" name="identification" /></label>
            <label className="field">Fecha de nacimiento<input className="input" name="birth_date" type="date" /></label>
            <label className="field">Dirección<input className="input" name="address" /></label>
            <label className="field span2">Notas<textarea name="notes" /></label>
            <div className="span2"><button className="button" type="submit">Guardar cliente</button></div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <form className="filterbar" action="/clientes">
            <input className="input" name="q" placeholder="Buscar por nombre, teléfono o ID" defaultValue={searchParams.q} />
          </form>
          <a className="button" href="/clientes?nuevo=1">+ Nuevo cliente</a>
        </div>
        {!clients || clients.length === 0 ? (
          <p className="empty">Sin clientes registrados todavía.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Cliente</th><th>Teléfono</th><th>Correo</th><th>Créditos</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {clients.map((c: any) => (
                <tr key={c.id}>
                  <td><strong>{c.full_name}</strong></td>
                  <td>{c.phone}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.loans?.length ?? 0}</td>
                  <td><span className={'badge ' + (c.active ? 'paid' : 'pending')}>{c.active ? 'Activo' : 'Inactivo'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  );
}
