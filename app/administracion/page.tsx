import { Shell, Top } from '@/components/shell';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/profile';
import { updateSettingsAction, createUserAction, toggleUserActive } from '@/lib/actions';

export const dynamic = 'force-dynamic';

const roleLabel: Record<string, string> = { admin: 'Administrador', operator: 'Capturista' };

export default async function Administracion({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createClient();
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === 'admin';

  const [{ data: settings }, { data: users }] = await Promise.all([
    supabase.from('system_settings').select('*').eq('id', true).single(),
    supabase.from('profiles').select('id,full_name,role,active').order('full_name'),
  ]);

  return (
    <Shell active="/administracion" userName={profile?.full_name} userRole={profile?.role}>
      <Top title="Administración" subtitle="Usuarios, permisos y configuración general" />
      {searchParams.error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{searchParams.error}</p>}
      {!isAdmin && <p className="small">Solo un administrador puede editar esta sección; la estás viendo en modo lectura.</p>}

      <div className="grid">
        <div className="card">
          <h2>Configuración predeterminada</h2>
          <form action={updateSettingsAction} className="form-grid">
            <label className="field">Moneda
              <select name="currency" defaultValue={settings?.currency ?? 'MXN'} disabled={!isAdmin}>
                <option value="MXN">MXN — Peso mexicano</option>
              </select>
            </label>
            <label className="field">Tasa anual predeterminada
              <input name="default_annual_rate" type="number" step="0.01" defaultValue={settings?.default_annual_rate ?? 36} disabled={!isAdmin} />
            </label>
            <label className="field">Días de tolerancia
              <input name="tolerance_days" type="number" defaultValue={settings?.tolerance_days ?? 3} disabled={!isAdmin} />
            </label>
            <label className="field">Regla de moratorios
              <select name="default_late_rule" defaultValue={settings?.default_late_rule ?? 'daily'} disabled={!isAdmin}>
                <option value="daily">Por día de atraso</option>
                <option value="per_overdue_period">Por periodo vencido</option>
                <option value="percent_overdue_balance">% sobre saldo vencido</option>
              </select>
            </label>
            <label className="field">Tasa de moratorio predeterminada
              <input name="default_late_rate" type="number" step="0.01" defaultValue={settings?.default_late_rate ?? 0} disabled={!isAdmin} />
            </label>
            <label className="field span2">Razón social para recibos
              <input name="company_name" placeholder="Nombre de la empresa" defaultValue={settings?.company_name ?? ''} disabled={!isAdmin} />
            </label>
            {isAdmin && <p><button className="button" type="submit">Guardar configuración</button></p>}
          </form>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Usuarios</h2>
          </div>
          <table className="table">
            <thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th>{isAdmin && <th></th>}</tr></thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.full_name}</strong></td>
                  <td>{roleLabel[u.role]}</td>
                  <td><span className={'badge ' + (u.active ? 'paid' : 'pending')}>{u.active ? 'Activo' : 'Inactivo'}</span></td>
                  {isAdmin && (
                    <td>
                      <form action={toggleUserActive}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="active" value={String(u.active)} />
                        <button className="link" type="submit" style={{ background: 'none', border: 0, cursor: 'pointer', font: 'inherit' }}>
                          {u.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {isAdmin && (
            <>
              <h2 style={{ marginTop: 22 }}>Nuevo usuario</h2>
              <form action={createUserAction} className="form-grid">
                <label className="field">Nombre completo<input className="input" name="full_name" required /></label>
                <label className="field">Correo<input className="input" name="email" type="email" required /></label>
                <label className="field">Contraseña temporal<input className="input" name="password" type="password" minLength={8} required /></label>
                <label className="field">Rol
                  <select name="role" required>
                    <option value="operator">Capturista</option>
                    <option value="admin">Administrador</option>
                  </select>
                </label>
                <div className="span2"><button className="button" type="submit">+ Usuario</button></div>
              </form>
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}
