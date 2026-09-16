export type LateRule = 'daily' | 'per_overdue_period' | 'percent_overdue_balance';

/**
 * Mirrors supabase/schema.sql's apply_late_fees() so a hypothetical date can be
 * previewed client/server-side without writing to the database (which only
 * ever recalculates against the real current date).
 *
 * IMPORTANT: the accrual formula (`added`) always computes the FULL
 * theoretical late fee for the elapsed days, with no notion of partial
 * payments already made toward it. `paidLate` (sum of
 * payment_allocations.late_amount for this installment) must be subtracted
 * from that theoretical total to get what's actually still owed — never take
 * max(currentLateInterestDue, added), since that re-inflates the fee back to
 * the full theoretical amount the moment `added` grows past whatever was
 * already collected, silently discarding real payments from the display.
 * apply_late_fees() in schema.sql had this exact bug and was fixed the same
 * way; see docs/moratorios-y-pagos-fix.md.
 */
export function projectLateFee(params: {
  dueDate: string;
  toleranceDays: number;
  targetDate: string;
  lateRule: LateRule;
  lateRate: number;
  principalDue: number;
  ordinaryInterestDue: number;
  paidAmount: number;
  currentLateInterestDue: number;
  paidLate: number;
}): { overdueDays: number; projectedLate: number; isOverdue: boolean } {
  const cutoff = new Date(params.dueDate + 'T00:00:00');
  cutoff.setDate(cutoff.getDate() + params.toleranceDays);
  const target = new Date(params.targetDate + 'T00:00:00');
  const overdueDays = Math.round((target.getTime() - cutoff.getTime()) / 86400000);

  if (overdueDays <= 0) {
    return { overdueDays: 0, projectedLate: params.currentLateInterestDue, isOverdue: false };
  }

  let added = 0;
  if (params.lateRule === 'daily') added = params.lateRate * overdueDays;
  else if (params.lateRule === 'per_overdue_period') added = params.lateRate;
  else if (params.lateRule === 'percent_overdue_balance') {
    added = ((params.principalDue + params.ordinaryInterestDue - params.paidAmount) * params.lateRate) / 100;
  }

  const projectedLate = Math.max(0, Math.round(added * 100) / 100 - params.paidLate);
  return { overdueDays, projectedLate, isOverdue: true };
}
