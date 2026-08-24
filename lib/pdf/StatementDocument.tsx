import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const INDIGO = '#4338ca';
const INDIGO_SOFT = '#eef0fe';
const INK = '#0f172a';
const MUTED = '#64748b';
const LINE = '#e2e5ee';
const GREEN = '#0a8f5b';
const RED = '#c22a2a';
const AMBER = '#b5730c';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: 'Helvetica', color: INK },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: INDIGO,
    paddingBottom: 12,
    marginBottom: 16,
  },
  companyName: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: INK },
  companySub: { fontSize: 8.5, color: MUTED, marginTop: 2 },
  statementTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: INDIGO, textAlign: 'right' },
  statementMeta: { fontSize: 8, color: MUTED, marginTop: 3, textAlign: 'right' },

  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  infoBox: { flex: 1, backgroundColor: '#f7f8fc', borderRadius: 6, padding: 10 },
  infoBoxTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  infoLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  infoLabel: { color: MUTED, fontSize: 8.5 },
  infoValue: { fontFamily: 'Helvetica-Bold', fontSize: 8.5 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  summaryBox: { flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 6, padding: 10 },
  summaryLabel: { fontSize: 7.5, color: MUTED, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  summaryValue: { fontSize: 15, fontFamily: 'Helvetica-Bold' },

  sectionTitle: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', marginBottom: 8, marginTop: 6 },

  table: { borderWidth: 1, borderColor: LINE, borderRadius: 4, marginBottom: 16 },
  tHeadRow: { flexDirection: 'row', backgroundColor: INDIGO },
  tHeadCell: { color: '#ffffff', fontSize: 7.5, fontFamily: 'Helvetica-Bold', padding: 6, textTransform: 'uppercase' },
  tRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: LINE },
  tRowAlt: { backgroundColor: '#fafafc' },
  tCell: { fontSize: 8.5, padding: 6, color: INK },

  badge: { fontSize: 7, fontFamily: 'Helvetica-Bold', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 8, alignSelf: 'flex-start' },

  empty: { fontSize: 8.5, color: MUTED, padding: 14, textAlign: 'center' },

  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: MUTED },
});

const statusLabel: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
  partial: 'Parcial',
  overdue: 'Vencida',
  restructured: 'Reestructurada',
};
const statusColor: Record<string, { bg: string; fg: string }> = {
  pending: { bg: '#fdf3e2', fg: AMBER },
  partial: { bg: '#fdf3e2', fg: AMBER },
  paid: { bg: '#e6f7ef', fg: GREEN },
  overdue: { bg: '#fbeaea', fg: RED },
  restructured: { bg: '#fdf3e2', fg: AMBER },
};
const methodLabel: Record<string, string> = { cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta', other: 'Otro' };
const loanStatusLabel: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activo',
  paid_off: 'Liquidado',
  cancelled: 'Cancelado',
  restructured: 'Reestructurado',
};

export type StatementInstallment = {
  sequence_no: number;
  due_date: string;
  principal_due: number;
  ordinary_interest_due: number;
  late_interest_due: number;
  paid_amount: number;
  status: string;
};
export type StatementPayment = {
  paid_at: string;
  amount: number;
  method: string;
  reference: string | null;
  principal_applied: number;
  interest_applied: number;
  late_applied: number;
};

export function StatementDocument({
  companyName,
  footerNote,
  generatedAt,
  client,
  loan,
  installments,
  payments,
  money,
}: {
  companyName: string;
  footerNote?: string | null;
  generatedAt: string;
  client: { full_name: string; phone: string; email?: string | null; address?: string | null; identification?: string | null };
  loan: {
    folio: string;
    status: string;
    principal: number;
    outstanding_balance: number;
    total_due: number;
    annual_interest_rate: number;
    disbursed_at: string;
    first_payment_at: string;
    frequency: string;
    installments_count: number;
  };
  installments: StatementInstallment[];
  payments: StatementPayment[];
  money: (n: number) => string;
}) {
  const nextDue = installments.find((i) => i.status === 'pending' || i.status === 'overdue' || i.status === 'partial');
  const fmtDate = (d: string) => new Date(d + (d.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <Document title={`Estado de cuenta ${loan.folio}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companySub}>Gestión de créditos personales</Text>
          </View>
          <View>
            <Text style={styles.statementTitle}>ESTADO DE CUENTA</Text>
            <Text style={styles.statementMeta}>Folio {loan.folio}</Text>
            <Text style={styles.statementMeta}>Generado el {generatedAt}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Cliente</Text>
            <View style={styles.infoLine}><Text style={styles.infoLabel}>Nombre</Text><Text style={styles.infoValue}>{client.full_name}</Text></View>
            <View style={styles.infoLine}><Text style={styles.infoLabel}>Teléfono</Text><Text style={styles.infoValue}>{client.phone}</Text></View>
            {client.identification ? (
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Identificación</Text><Text style={styles.infoValue}>{client.identification}</Text></View>
            ) : null}
            {client.address ? (
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Dirección</Text><Text style={styles.infoValue}>{client.address}</Text></View>
            ) : null}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Crédito</Text>
            <View style={styles.infoLine}><Text style={styles.infoLabel}>Estado</Text><Text style={styles.infoValue}>{loanStatusLabel[loan.status] ?? loan.status}</Text></View>
            <View style={styles.infoLine}><Text style={styles.infoLabel}>Monto original</Text><Text style={styles.infoValue}>{money(loan.principal)}</Text></View>
            <View style={styles.infoLine}><Text style={styles.infoLabel}>Tasa anual</Text><Text style={styles.infoValue}>{loan.annual_interest_rate}%</Text></View>
            <View style={styles.infoLine}><Text style={styles.infoLabel}>Dispersión</Text><Text style={styles.infoValue}>{fmtDate(loan.disbursed_at)}</Text></View>
            <View style={styles.infoLine}><Text style={styles.infoLabel}>Parcialidades</Text><Text style={styles.infoValue}>{loan.installments_count}</Text></View>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Saldo pendiente (capital)</Text>
            <Text style={styles.summaryValue}>{money(loan.outstanding_balance)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total a pagar (con interés)</Text>
            <Text style={styles.summaryValue}>{money(loan.total_due)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Próximo vencimiento</Text>
            <Text style={styles.summaryValue}>{nextDue ? fmtDate(nextDue.due_date) : '—'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Detalle de parcialidades</Text>
        <View style={styles.table}>
          <View style={styles.tHeadRow}>
            <Text style={[styles.tHeadCell, { width: '6%' }]}>#</Text>
            <Text style={[styles.tHeadCell, { width: '16%' }]}>Vencimiento</Text>
            <Text style={[styles.tHeadCell, { width: '15%' }]}>Capital</Text>
            <Text style={[styles.tHeadCell, { width: '15%' }]}>Interés</Text>
            <Text style={[styles.tHeadCell, { width: '15%' }]}>Moratorio</Text>
            <Text style={[styles.tHeadCell, { width: '15%' }]}>Pagado</Text>
            <Text style={[styles.tHeadCell, { width: '18%' }]}>Estado</Text>
          </View>
          {installments.length === 0 ? (
            <Text style={styles.empty}>Este crédito no tiene parcialidades generadas.</Text>
          ) : (
            installments.map((i, idx) => {
              const sc = statusColor[i.status] ?? statusColor.pending;
              return (
                <View key={i.sequence_no} style={[styles.tRow, idx % 2 === 1 ? styles.tRowAlt : {}]} wrap={false}>
                  <Text style={[styles.tCell, { width: '6%' }]}>{i.sequence_no}</Text>
                  <Text style={[styles.tCell, { width: '16%' }]}>{fmtDate(i.due_date)}</Text>
                  <Text style={[styles.tCell, { width: '15%' }]}>{money(i.principal_due)}</Text>
                  <Text style={[styles.tCell, { width: '15%' }]}>{money(i.ordinary_interest_due)}</Text>
                  <Text style={[styles.tCell, { width: '15%' }]}>{money(i.late_interest_due)}</Text>
                  <Text style={[styles.tCell, { width: '15%' }]}>{money(i.paid_amount)}</Text>
                  <View style={[styles.tCell, { width: '18%' }]}>
                    <Text style={[styles.badge, { backgroundColor: sc.bg, color: sc.fg }]}>{statusLabel[i.status] ?? i.status}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <Text style={styles.sectionTitle}>Historial de pagos</Text>
        <View style={styles.table}>
          <View style={styles.tHeadRow}>
            <Text style={[styles.tHeadCell, { width: '16%' }]}>Fecha</Text>
            <Text style={[styles.tHeadCell, { width: '16%' }]}>Método</Text>
            <Text style={[styles.tHeadCell, { width: '20%' }]}>Referencia</Text>
            <Text style={[styles.tHeadCell, { width: '16%' }]}>Capital</Text>
            <Text style={[styles.tHeadCell, { width: '16%' }]}>Interés + moratorio</Text>
            <Text style={[styles.tHeadCell, { width: '16%' }]}>Total</Text>
          </View>
          {payments.length === 0 ? (
            <Text style={styles.empty}>Sin pagos registrados a la fecha.</Text>
          ) : (
            payments.map((p, idx) => (
              <View key={idx} style={[styles.tRow, idx % 2 === 1 ? styles.tRowAlt : {}]} wrap={false}>
                <Text style={[styles.tCell, { width: '16%' }]}>{fmtDate(p.paid_at)}</Text>
                <Text style={[styles.tCell, { width: '16%' }]}>{methodLabel[p.method] ?? p.method}</Text>
                <Text style={[styles.tCell, { width: '20%' }]}>{p.reference || '—'}</Text>
                <Text style={[styles.tCell, { width: '16%' }]}>{money(p.principal_applied)}</Text>
                <Text style={[styles.tCell, { width: '16%' }]}>{money(p.interest_applied + p.late_applied)}</Text>
                <Text style={[styles.tCell, { width: '16%' }]}>{money(p.amount)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{footerNote || 'Este documento es informativo y está sujeto a verificación con la administración.'}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
