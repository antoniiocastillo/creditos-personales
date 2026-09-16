import { describe, expect, it } from 'vitest';
import { projectLateFee } from './lateFees';

const base = {
  dueDate: '2026-09-01',
  toleranceDays: 0,
  lateRule: 'daily' as const,
  lateRate: 50,
  principalDue: 0,
  ordinaryInterestDue: 450,
  paidAmount: 0,
  currentLateInterestDue: 0,
  paidLate: 0,
};

describe('projectLateFee', () => {
  it('no proyecta moratorio antes de la fecha límite (con tolerancia)', () => {
    const r = projectLateFee({ ...base, toleranceDays: 3, targetDate: '2026-09-03' });
    expect(r.isOverdue).toBe(false);
    expect(r.projectedLate).toBe(0);
  });

  it('acumula el moratorio teorico completo cuando nada se ha pagado de moratorio', () => {
    const r = projectLateFee({ ...base, targetDate: '2026-09-08' });
    expect(r.overdueDays).toBe(7);
    expect(r.projectedLate).toBe(350);
  });

  it('resta lo ya pagado de moratorio en vez de tomar el maximo (regresion CR-2026-00012)', () => {
    // 7 dias de atraso * 50 = 350 de moratorio teorico acumulado.
    // Si ya se pagaron los 350 completos, el proyectado debe ser 0, no volver a 350.
    const paidInFull = projectLateFee({ ...base, targetDate: '2026-09-08', paidLate: 350 });
    expect(paidInFull.projectedLate).toBe(0);

    // Si solo se pagaron 100 de los 350, deben quedar 250 pendientes.
    const paidPartial = projectLateFee({ ...base, targetDate: '2026-09-08', paidLate: 100 });
    expect(paidPartial.projectedLate).toBe(250);
  });

  it('nunca proyecta un moratorio negativo si se pago de mas', () => {
    const r = projectLateFee({ ...base, targetDate: '2026-09-08', paidLate: 999 });
    expect(r.projectedLate).toBe(0);
  });
});
