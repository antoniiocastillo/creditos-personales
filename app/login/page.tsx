import { signIn } from '@/lib/actions';

export default function Login({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="auth-shell">
      <section className="auth-brand">
        <div className="auth-brand-mark">
          <span className="logo">C</span>
          Crédito Fácil
        </div>
        <div className="auth-brand-copy">
          <h2>Gestión de cartera crediticia, sin fricción.</h2>
          <p>Administra clientes, créditos, cobranza y moratorios desde un solo lugar, con la seguridad y el control que tu operación necesita.</p>
        </div>
        <div className="auth-stats">
          <div>
            <strong>100%</strong>
            <span>Trazabilidad de pagos</span>
          </div>
          <div>
            <strong>RLS</strong>
            <span>Seguridad a nivel de fila</span>
          </div>
          <div>
            <strong>24/7</strong>
            <span>Disponibilidad en la nube</span>
          </div>
        </div>
      </section>
      <section className="auth-panel">
        <form action={signIn} className="auth-card">
          <div>
            <h1>Inicia sesión</h1>
            <p className="small">Ingresa con tu correo y contraseña para continuar</p>
          </div>
          {searchParams.error && <p className="auth-error">{searchParams.error}</p>}
          <label className="field">
            Correo
            <input className="input" name="email" type="email" required autoFocus placeholder="tu@empresa.com" />
          </label>
          <label className="field">
            Contraseña
            <input className="input" name="password" type="password" required placeholder="••••••••" />
          </label>
          <button className="button" type="submit">Entrar</button>
        </form>
      </section>
    </div>
  );
}
