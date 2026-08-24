import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function toCsv(rows: (string | number)[][]) {
  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') ?? 'clientes';
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  let rows: (string | number)[][] = [];
  let filename = 'reporte.csv';

  if (type === 'antiguedad') {
    filename = 'cartera-por-antiguedad.csv';
    const { data } = await supabase
      .from('installments')
      .select('due_date,principal_due,ordinary_interest_due,late_interest_due,paid_amount,loans(folio,clients(full_name))')
      .not('status', 'in', '(paid,restructured)')
      .lt('due_date', today)
      .order('due_date', { ascending: true });
    rows = [['Folio', 'Cliente', 'Vencimiento', 'Días de atraso', 'Saldo vencido']];
    (data ?? []).forEach((i: any) => {
      const days = Math.floor((Date.now() - new Date(i.due_date).getTime()) / 86400000);
      const balance = Number(i.principal_due) + Number(i.ordinary_interest_due) + Number(i.late_interest_due) - Number(i.paid_amount);
      rows.push([i.loans?.folio ?? '', i.loans?.clients?.full_name ?? '', i.due_date, days, balance.toFixed(2)]);
    });
  } else if (type === 'pagos') {
    filename = 'pagos-por-periodo.csv';
    const { data } = await supabase
      .from('payments')
      .select('paid_at,amount,method,loans(folio),clients(full_name)')
      .order('paid_at', { ascending: false });
    rows = [['Fecha', 'Folio', 'Cliente', 'Monto', 'Método']];
    (data ?? []).forEach((p: any) => {
      rows.push([p.paid_at, p.loans?.folio ?? '', p.clients?.full_name ?? '', Number(p.amount).toFixed(2), p.method]);
    });
  } else {
    filename = 'estado-de-cuenta-por-cliente.csv';
    const { data } = await supabase
      .from('clients')
      .select('full_name,phone,loans(folio,principal,outstanding_balance,status)')
      .order('full_name');
    rows = [['Cliente', 'Teléfono', 'Folio', 'Monto original', 'Saldo pendiente', 'Estado']];
    (data ?? []).forEach((c: any) => {
      if (!c.loans || c.loans.length === 0) {
        rows.push([c.full_name, c.phone, '', '', '', '']);
      }
      (c.loans ?? []).forEach((l: any) => {
        rows.push([c.full_name, c.phone, l.folio, Number(l.principal).toFixed(2), Number(l.outstanding_balance).toFixed(2), l.status]);
      });
    });
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
