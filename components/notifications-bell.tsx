'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { IconBell } from '@/components/icons';
import { money } from '@/lib/money';

export type OverdueItem = {
  loanId: string;
  folio: string;
  clientName: string;
  dueDate: string;
  amount: number;
};

export function NotificationsBell({ items, totalCount }: { items: OverdueItem[]; totalCount: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });

  return (
    <div className="notif" ref={ref}>
      <button type="button" className="notif-button" onClick={() => setOpen((v) => !v)} aria-label="Notificaciones">
        <IconBell size={19} />
        {totalCount > 0 && <span className="notif-badge" />}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-head">
            <strong>Pagos vencidos</strong>
            <span className="small">{totalCount} crédito{totalCount === 1 ? '' : 's'} sin pagar a tiempo</span>
          </div>
          {items.length === 0 ? (
            <p className="empty" style={{ padding: 20 }}>No hay pagos vencidos por revisar.</p>
          ) : (
            <div className="notif-list">
              {items.map((i) => (
                <Link key={i.loanId} href={`/creditos/${i.loanId}`} className="notif-item" onClick={() => setOpen(false)}>
                  <div>
                    <strong>{i.clientName}</strong>
                    <div className="small">{i.folio} · vencía el {fmtDate(i.dueDate)}</div>
                  </div>
                  <span className="badge late">{money(i.amount)}</span>
                </Link>
              ))}
            </div>
          )}
          {totalCount > items.length && (
            <Link href="/pagos" className="notif-dropdown-foot" onClick={() => setOpen(false)}>
              Ver todos en Pagos →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
