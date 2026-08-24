import { signIn } from '@/lib/actions';

export default function Login({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
      <form action={signIn} className="card" style={{ width: 360, display: 'grid', gap: 15 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 20 }}>Crédito Fácil</h1>
          <p className="small" style={{ margin: 0 }}>Inicia sesión para continuar</p>
        </div>
        {searchParams.error && (
          <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>{searchParams.error}</p>
        )}
        <label className="field">
          Correo
          <input className="input" name="email" type="email" required autoFocus />
        </label>
        <label className="field">
          Contraseña
          <input className="input" name="password" type="password" required />
        </label>
        <button className="button" type="submit">Entrar</button>
      </form>
    </div>
  );
}
