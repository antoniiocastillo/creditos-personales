import type { Frequency } from '@/lib/amortization';

/**
 * Tasas fijas de interés por parcialidad según la frecuencia del crédito.
 * Semanal y mensual son automáticas (el capturista no las captura); quincenal
 * y personalizada se escriben a mano por si aplica algún caso especial.
 */
export const FIXED_RATE_BY_FREQUENCY: Partial<Record<Frequency, number>> = {
  weekly: 15,
  monthly: 20,
};

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  weekly: 'semanal',
  biweekly: 'quincenal',
  monthly: 'mensual',
  custom: 'personalizada',
};

export function fixedRateFor(frequency: string): number | undefined {
  return FIXED_RATE_BY_FREQUENCY[frequency as Frequency];
}
