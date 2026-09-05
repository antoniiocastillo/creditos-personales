'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Tablas que, al cambiar (otro usuario registra un pago, se otorga un
// crédito, etc.), deben reflejarse en pantalla sin que alguien tenga que
// recargar la página manualmente.
const TABLES = ['payments', 'installments', 'loans', 'clients', 'payment_allocations'] as const;

export function RealtimeRefresher() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let supabase;
    try {
      supabase = createClient();
    } catch {
      // Sin variables de entorno de Supabase disponibles en este contexto: no hace nada.
      return;
    }

    const channel = supabase.channel('app-changes');
    TABLES.forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        // Se agrupan varios cambios seguidos (p. ej. un pago que actualiza
        // payments + installments + loans) en un solo refresh.
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => router.refresh(), 500);
      });
    });
    channel.subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
