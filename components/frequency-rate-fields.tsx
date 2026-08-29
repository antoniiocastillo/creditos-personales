'use client';

import { useState } from 'react';
import { fixedRateFor, FREQUENCY_LABEL } from '@/lib/interestRates';
import type { Frequency } from '@/lib/amortization';

export function FrequencyAndRateFields({
  defaultFrequency = 'weekly',
  defaultRate,
}: {
  defaultFrequency?: Frequency;
  defaultRate?: number;
}) {
  const [frequency, setFrequency] = useState<Frequency>(defaultFrequency);
  const fixed = fixedRateFor(frequency);

  return (
    <>
      <label className="field">
        Frecuencia
        <select name="frequency" required value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
          <option value="weekly">Semanal</option>
          <option value="biweekly">Quincenal</option>
          <option value="monthly">Mensual</option>
          <option value="custom">Personalizada (días)</option>
        </select>
      </label>

      <label className="field">
        Tasa de interés (%)
        {fixed != null ? (
          <>
            <input className="input" value={`${fixed}% fijo (${FREQUENCY_LABEL[frequency]})`} disabled />
            <input type="hidden" name="annual_interest_rate" value={fixed} />
          </>
        ) : (
          <input
            className="input"
            name="annual_interest_rate"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaultRate}
            required
          />
        )}
      </label>
    </>
  );
}
