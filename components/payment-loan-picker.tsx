'use client';

import { useState } from 'react';
import { money } from '@/lib/money';

export type LoanOption = {
  id: string;
  folio: string;
  clientName: string;
  outstandingBalance: number;
  nextDueDate: string | null;
  nextAmount: number | null;
};

export function PaymentLoanPicker({ loans }: { loans: LoanOption[] }) {
  const [selectedId, setSelectedId] = useState('');
  const selected = loans.find((l) => l.id === selectedId);

  return (
    <>
      <label className="field span2">
        Crédito
        <select name="loan_id" required value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          <option value="">Selecciona un crédito</option>
          {loans.map((l) => (
            <option key={l.id} value={l.id}>
              {l.folio} · {l.clientName}
            </option>
          ))}
        </select>
      </label>

      <div className="span2">
        {selected ? (
          <div className="payment-info">
            <div className="payment-info-head">
              <strong>{selected.folio}</strong>
              <span>{selected.clientName}</span>
            </div>
            <div className="payment-info-stats">
              <div>
                <span className="small">Saldo pendiente (capital)</span>
                <strong>{money(selected.outstandingBalance)}</strong>
              </div>
              <div>
                <span className="small">Próximo pago</span>
                <strong>
                  {selected.nextAmount != null ? money(selected.nextAmount) : '—'}
                  {selected.nextDueDate && (
                    <span className="small">
                      {' '}
                      · vence {new Date(selected.nextDueDate + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </strong>
              </div>
            </div>
          </div>
        ) : (
          <p className="small" style={{ margin: 0 }}>
            Selecciona un crédito para ver su saldo y el monto del próximo pago.
          </p>
        )}
      </div>
    </>
  );
}
