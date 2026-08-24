import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { StatementDocument } from '@/lib/pdf/StatementDocument';
import { money } from '@/lib/money';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: loan }, { data: installments }, { data: payments }, { data: settings }] = await Promise.all([
    supabase
      .from('loans')
      .select(
        'folio,status,principal,outstanding_balance,total_due,annual_interest_rate,disbursed_at,first_payment_at,frequency,installments_count,clients(full_name,phone,email,address,identification)',
      )
      .eq('id', params.id)
      .single(),
    supabase
      .from('installments')
      .select('sequence_no,due_date,principal_due,ordinary_interest_due,late_interest_due,paid_amount,status')
      .eq('loan_id', params.id)
      .order('sequence_no', { ascending: true }),
    supabase
      .from('payments')
      .select('paid_at,amount,method,reference,principal_applied,interest_applied,late_applied')
      .eq('loan_id', params.id)
      .order('paid_at', { ascending: false }),
    supabase.from('system_settings').select('company_name,receipt_footer').eq('id', true).single(),
  ]);

  if (!loan) return new NextResponse('Crédito no encontrado', { status: 404 });

  const client = (loan as any).clients ?? { full_name: '', phone: '' };

  const buffer = await renderToBuffer(
    <StatementDocument
      companyName={settings?.company_name || 'Crédito Fácil'}
      footerNote={settings?.receipt_footer}
      generatedAt={new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
      client={client}
      loan={{
        folio: loan.folio,
        status: loan.status,
        principal: Number(loan.principal),
        outstanding_balance: Number(loan.outstanding_balance),
        total_due: Number(loan.total_due),
        annual_interest_rate: Number(loan.annual_interest_rate),
        disbursed_at: loan.disbursed_at,
        first_payment_at: loan.first_payment_at,
        frequency: loan.frequency,
        installments_count: loan.installments_count,
      }}
      installments={(installments ?? []).map((i: any) => ({
        sequence_no: i.sequence_no,
        due_date: i.due_date,
        principal_due: Number(i.principal_due),
        ordinary_interest_due: Number(i.ordinary_interest_due),
        late_interest_due: Number(i.late_interest_due),
        paid_amount: Number(i.paid_amount),
        status: i.status,
      }))}
      payments={(payments ?? []).map((p: any) => ({
        paid_at: p.paid_at,
        amount: Number(p.amount),
        method: p.method,
        reference: p.reference,
        principal_applied: Number(p.principal_applied),
        interest_applied: Number(p.interest_applied),
        late_applied: Number(p.late_applied),
      }))}
      money={money}
    />,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="estado-cuenta-${loan.folio}.pdf"`,
    },
  });
}
