import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [email, password, fullName = 'Administrador'] = process.argv.slice(2);

if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
if (!email || !password) throw new Error('Uso: node scripts/bootstrap-admin.mjs <email> <password> [nombre]');

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (error) {
  console.error('Error creando usuario:', error.message);
  process.exit(1);
}

const { error: profileError } = await admin.from('profiles').insert({ id: data.user.id, full_name: fullName, role: 'admin' });
if (profileError) {
  console.error('Error creando perfil:', profileError.message);
  process.exit(1);
}

console.log('Usuario admin creado:', email, data.user.id);
