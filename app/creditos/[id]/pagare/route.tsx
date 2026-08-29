import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { PagareDocument } from '@/lib/pdf/PagareDocument';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: loan }, { data: installments }, { data: settings }] = await Promise.all([
    supabase
      .from('loans')
      .select('folio,principal,total_due,disbursed_at,late_rule,late_rate,clients(full_name,identification,address)')
      .eq('id', params.id)
      .single(),
    supabase
      .from('installments')
      .select('sequence_no,due_date,principal_due,ordinary_interest_due')
      .eq('loan_id', params.id)
      .order('sequence_no', { ascending: true }),
    supabase.from('system_settings').select('company_name').eq('id', true).single(),
  ]);

  if (!loan) return new NextResponse('Crédito no encontrado', { status: 404 });

  const client = (loan as any).clients ?? { full_name: '', identification: null, address: null };
  const companyName = settings?.company_name || 'Crédito Fácil';

  const buffer = await renderToBuffer(
    <PagareDocument
      companyName={companyName}
      today={new Date().toISOString().slice(0, 10)}
      client={client}
      loan={{
        folio: loan.folio,
        principal: Number(loan.principal),
        total_due: Number(loan.total_due),
        disbursed_at: loan.disbursed_at,
        late_rule: loan.late_rule,
        late_rate: Number(loan.late_rate),
      }}
      installments={(installments ?? []).map((i: any) => ({
        sequence_no: i.sequence_no,
        due_date: i.due_date,
        amount: Number(i.principal_due) + Number(i.ordinary_interest_due),
      }))}
    />,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="pagare-${loan.folio}.pdf"`,
    },
  });
}
