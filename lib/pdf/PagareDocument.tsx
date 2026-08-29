import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { moneyInWords } from '@/lib/numberToWords';

const INK = '#0f172a';
const MUTED = '#64748b';
const LINE = '#c7cbd6';
const INDIGO = '#4338ca';

const styles = StyleSheet.create({
  page: { padding: 44, fontSize: 10.5, fontFamily: 'Helvetica', color: INK, lineHeight: 1.5 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', textAlign: 'center', letterSpacing: 3, marginBottom: 4 },
  folio: { fontSize: 9, color: MUTED, textAlign: 'center', marginBottom: 22 },

  amountBox: {
    borderWidth: 1.5,
    borderColor: INDIGO,
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  amountLabel: { fontSize: 8, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  amountNumber: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: INDIGO, marginBottom: 4 },
  amountWords: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  amountBreakdown: { fontSize: 8.5, color: MUTED, marginTop: 6 },

  placeDate: { textAlign: 'right', marginBottom: 18, fontSize: 10 },

  paragraph: { marginBottom: 14, textAlign: 'justify' },
  bold: { fontFamily: 'Helvetica-Bold' },

  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 8, marginTop: 6 },

  table: { borderWidth: 1, borderColor: LINE, marginBottom: 18 },
  tHeadRow: { flexDirection: 'row', backgroundColor: '#eef0fe' },
  tHeadCell: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', padding: 6, textTransform: 'uppercase', color: INDIGO },
  tRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: LINE },
  tCell: { fontSize: 9.5, padding: 6 },

  legal: { fontSize: 8.5, color: MUTED, textAlign: 'justify', marginTop: 6, marginBottom: 30 },

  signatures: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 },
  sigBlock: { width: '42%', alignItems: 'center' },
  sigLine: { borderTopWidth: 1, borderTopColor: INK, width: '100%', marginBottom: 6 },
  sigLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  sigSub: { fontSize: 8, color: MUTED, marginTop: 2 },

  footer: {
    position: 'absolute',
    bottom: 24,
    left: 44,
    right: 44,
    fontSize: 7,
    color: MUTED,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 8,
  },
});

export type PagareInstallment = { sequence_no: number; due_date: string; amount: number };

export function PagareDocument({
  companyName,
  today,
  client,
  loan,
  installments,
}: {
  companyName: string;
  today: string;
  client: { full_name: string; identification?: string | null; address?: string | null };
  loan: {
    folio: string;
    principal: number;
    total_due: number;
    disbursed_at: string;
    late_rule: string;
    late_rate: number;
    has_guarantee: boolean;
    guarantee_description: string | null;
  };
  installments: PagareInstallment[];
}) {
  const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  const money = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

  const lateDescription: Record<string, string> = {
    daily: `${money(loan.late_rate)} por cada día de atraso`,
    per_overdue_period: `${money(loan.late_rate)} fijos por cada parcialidad vencida`,
    percent_overdue_balance: `${loan.late_rate}% sobre el saldo de la parcialidad vencida`,
  };

  return (
    <Document title={`Pagaré ${loan.folio}`}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>PAGARÉ</Text>
        <Text style={styles.folio}>{companyName} · Folio {loan.folio}</Text>

        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Total a pagar (capital + interés)</Text>
          <Text style={styles.amountNumber}>{money(loan.total_due)}</Text>
          <Text style={styles.amountWords}>{moneyInWords(loan.total_due)}</Text>
          <Text style={styles.amountBreakdown}>
            Capital recibido en efectivo: {money(loan.principal)} · Interés total: {money(loan.total_due - loan.principal)}
          </Text>
        </View>

        <Text style={styles.placeDate}>Delicias, Chihuahua, a {fmtDate(today)}</Text>

        <Text style={styles.paragraph}>
          Reconozco haber recibido en este acto, en efectivo y a mi entera satisfacción, la cantidad de{' '}
          <Text style={styles.bold}>{money(loan.principal)}</Text> ({moneyInWords(loan.principal)}) en calidad de préstamo. En consecuencia,
          debo y pagaré incondicionalmente a la orden de <Text style={styles.bold}>{companyName}</Text> la cantidad total de{' '}
          <Text style={styles.bold}>{money(loan.total_due)}</Text> ({moneyInWords(loan.total_due)}) — que corresponde al capital recibido más
          los intereses pactados — mediante los pagos parciales que se detallan en el siguiente plan de pagos, sin que dichos abonos parciales
          modifiquen el carácter único e indivisible de este pagaré.
        </Text>

        <Text style={styles.sectionTitle}>Plan de pagos</Text>
        <View style={styles.table}>
          <View style={styles.tHeadRow}>
            <Text style={[styles.tHeadCell, { width: '15%' }]}>#</Text>
            <Text style={[styles.tHeadCell, { width: '45%' }]}>Fecha de pago</Text>
            <Text style={[styles.tHeadCell, { width: '40%' }]}>Importe</Text>
          </View>
          {installments.map((i) => (
            <View key={i.sequence_no} style={styles.tRow} wrap={false}>
              <Text style={[styles.tCell, { width: '15%' }]}>{i.sequence_no}</Text>
              <Text style={[styles.tCell, { width: '45%' }]}>{fmtDate(i.due_date)}</Text>
              <Text style={[styles.tCell, { width: '40%' }]}>{money(i.amount)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.paragraph}>
          En caso de no cubrir puntualmente cualquiera de las parcialidades señaladas, me obligo a pagar un interés moratorio equivalente a{' '}
          {lateDescription[loan.late_rule] ?? `${loan.late_rate}`}, sin perjuicio del derecho de <Text style={styles.bold}>{companyName}</Text> a
          exigir el pago total del saldo insoluto y de ejercer las acciones legales que en derecho correspondan.
        </Text>

        {loan.has_guarantee && (
          <Text style={styles.paragraph}>
            Como garantía del cumplimiento de esta obligación, dejo en garantía lo siguiente: <Text style={styles.bold}>{loan.guarantee_description || 'sin especificar'}</Text>,
            mismo que quedará en poder del acreedor hasta la total liquidación de este pagaré.
          </Text>
        )}

        <Text style={styles.legal}>
          Este documento es un pagaré en los términos de los artículos 170 y 174 de la Ley General de Títulos y Operaciones de Crédito. Lugar
          de pago: el señalado en este documento. No sujeto a protesto.
        </Text>

        <View style={styles.signatures}>
          <View style={styles.sigBlock}>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>{client.full_name}</Text>
            <Text style={styles.sigSub}>Deudor {client.identification ? `· ${client.identification}` : ''}</Text>
          </View>
          <View style={styles.sigBlock}>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>{companyName}</Text>
            <Text style={styles.sigSub}>Beneficiario</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Documento generado por {companyName} el {fmtDate(today)}. Verifique el contenido antes de firmar.
        </Text>
      </Page>
    </Document>
  );
}
