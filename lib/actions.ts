'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSchedule, type Frequency } from '@/lib/amortization';
import { getCurrentProfile } from '@/lib/profile';

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

// --- Auth ---

export async function signIn(formData: FormData) {
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) fail('/login', 'Correo o contraseña incorrectos');
  redirect('/');
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

// --- Clientes ---

const clientSchema = z.object({
  full_name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  identification: z.string().optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export async function createClientAction(formData: FormData) {
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) fail('/clientes', 'Revisa los datos del cliente');
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const v = parsed.data!;
  const { error } = await supabase.from('clients').insert({
    full_name: v.full_name,
    phone: v.phone,
    email: v.email || null,
    address: v.address || null,
    identification: v.identification || null,
    birth_date: v.birth_date || null,
    notes: v.notes || null,
    created_by: user?.id,
  });
  if (error) fail('/clientes', error.message);
  revalidatePath('/clientes');
  redirect('/clientes');
}

export async function toggleClientActive(formData: FormData) {
  const id = String(formData.get('id'));
  const active = formData.get('active') === 'true';
  const supabase = createClient();
  await supabase.from('clients').update({ active: !active }).eq('id', id);
  revalidatePath('/clientes');
}

// --- Créditos ---

const loanSchema = z.object({
  client_id: z.string().uuid(),
  principal: z.coerce.number().positive(),
  disbursed_at: z.string().min(1),
  first_payment_at: z.string().min(1),
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'custom']),
  custom_days: z.coerce.number().optional(),
  installments_count: z.coerce.number().int().positive(),
  interest_type: z.enum(['simple', 'declining_balance']),
  annual_interest_rate: z.coerce.number().min(0),
  tolerance_days: z.coerce.number().int().min(0).default(3),
  late_rule: z.enum(['daily', 'per_overdue_period', 'percent_overdue_balance']),
  late_rate: z.coerce.number().min(0).default(0),
});

export async function createLoanAction(formData: FormData) {
  const parsed = loanSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) fail('/creditos', 'Revisa los datos del crédito');
  const v = parsed.data!;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: folioData, error: folioError } = await supabase.rpc('generate_folio');
  if (folioError) fail('/creditos', folioError.message);
  const folio = folioData as string;

  const schedule = createSchedule({
    principal: v.principal,
    annualRate: v.annual_interest_rate,
    installments: v.installments_count,
    firstPayment: v.first_payment_at,
    frequency: v.frequency as Frequency,
    customDays: v.custom_days,
    type: v.interest_type === 'simple' ? 'simple' : 'declining',
  });
  const totalDue = schedule.reduce((sum, row) => sum + row.total, 0);

  const { data: loan, error: loanError } = await supabase
    .from('loans')
    .insert({
      folio,
      client_id: v.client_id,
      principal: v.principal,
      disbursed_at: v.disbursed_at,
      first_payment_at: v.first_payment_at,
      frequency: v.frequency,
      custom_days: v.custom_days ?? null,
      installments_count: v.installments_count,
      interest_type: v.interest_type,
      annual_interest_rate: v.annual_interest_rate,
      tolerance_days: v.tolerance_days,
      late_rule: v.late_rule,
      late_rate: v.late_rate,
      status: 'active',
      total_due: +totalDue.toFixed(2),
      outstanding_balance: v.principal,
      created_by: user?.id,
    })
    .select('id')
    .single();
  if (loanError || !loan) fail('/creditos', loanError?.message ?? 'No se pudo crear el crédito');

  const installmentsRows = schedule.map((row) => ({
    loan_id: loan!.id,
    sequence_no: row.number,
    due_date: row.dueDate,
    principal_due: row.principal,
    ordinary_interest_due: row.interest,
    remaining_balance: row.balance,
  }));
  const { error: instError } = await supabase.from('installments').insert(installmentsRows);
  if (instError) fail('/creditos', instError.message);

  revalidatePath('/creditos');
  revalidatePath('/');
  redirect('/creditos');
}

// --- Pagos ---

const paymentSchema = z.object({
  loan_id: z.string().uuid(),
  amount: z.coerce.number().positive(),
  method: z.enum(['cash', 'transfer', 'card', 'other']),
  reference: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export async function registerPaymentAction(formData: FormData) {
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) fail('/pagos', 'Revisa los datos del pago');
  const v = parsed.data!;
  const supabase = createClient();
  const { error } = await supabase.rpc('register_payment', {
    p_loan: v.loan_id,
    p_amount: v.amount,
    p_method: v.method,
    p_reference: v.reference || null,
    p_notes: v.notes || null,
  });
  if (error) fail('/pagos', error.message);
  revalidatePath('/pagos');
  revalidatePath('/creditos');
  revalidatePath('/');
  redirect('/pagos');
}

// --- Administración ---

const settingsSchema = z.object({
  currency: z.string().min(1),
  default_annual_rate: z.coerce.number().min(0),
  default_late_rule: z.enum(['daily', 'per_overdue_period', 'percent_overdue_balance']),
  default_late_rate: z.coerce.number().min(0),
  tolerance_days: z.coerce.number().int().min(0),
  company_name: z.string().optional().or(z.literal('')),
  receipt_footer: z.string().optional().or(z.literal('')),
});

export async function updateSettingsAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== 'admin') fail('/administracion', 'Solo un administrador puede cambiar la configuración');
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) fail('/administracion', 'Revisa la configuración');
  const v = parsed.data!;
  const supabase = createClient();
  const { error } = await supabase
    .from('system_settings')
    .update({
      currency: v.currency,
      default_annual_rate: v.default_annual_rate,
      default_late_rule: v.default_late_rule,
      default_late_rate: v.default_late_rate,
      tolerance_days: v.tolerance_days,
      company_name: v.company_name || null,
      receipt_footer: v.receipt_footer || null,
    })
    .eq('id', true);
  if (error) fail('/administracion', error.message);
  revalidatePath('/administracion');
  redirect('/administracion');
}

const userSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'operator']),
});

export async function createUserAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== 'admin') fail('/administracion', 'Solo un administrador puede crear usuarios');
  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) fail('/administracion', 'Revisa los datos del usuario');
  const v = parsed.data!;
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: v.email,
    password: v.password,
    email_confirm: true,
  });
  if (error || !data.user) fail('/administracion', error?.message ?? 'No se pudo crear el usuario');

  const supabase = createClient();
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: data.user.id, full_name: v.full_name, role: v.role });
  if (profileError) fail('/administracion', profileError.message);

  revalidatePath('/administracion');
  redirect('/administracion');
}

export async function toggleUserActive(formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== 'admin') fail('/administracion', 'Solo un administrador puede cambiar usuarios');
  const id = String(formData.get('id'));
  const active = formData.get('active') === 'true';
  const supabase = createClient();
  await supabase.from('profiles').update({ active: !active }).eq('id', id);
  revalidatePath('/administracion');
}

const changePasswordSchema = z.object({
  id: z.string().uuid(),
  password: z.string().min(8),
});

export async function changeUserPasswordAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== 'admin') fail('/administracion', 'Solo un administrador puede cambiar contraseñas');
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) fail('/administracion', 'La contraseña debe tener al menos 8 caracteres');
  const v = parsed.data!;
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(v.id, { password: v.password });
  if (error) fail('/administracion', error.message);
  revalidatePath('/administracion');
  redirect('/administracion?passwordChanged=1');
}
