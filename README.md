# Crédito Fácil

Sistema web para administrar clientes, préstamos, planes de pago, cobranza y moratorios. Está construido con Next.js 14 y Supabase, y se adapta a escritorio y móvil.

## Arranque local

1. Copia `.env.example` a `.env.local` y completa las variables de tu proyecto Supabase.
2. En Supabase, abre **SQL Editor** y ejecuta `supabase/schema.sql`; después ejecuta `supabase/seed.sql` si deseas los clientes de ejemplo.
3. Crea al menos un usuario en **Authentication > Users** y su fila correspondiente en `profiles` con rol `admin`.
4. Ejecuta `npm install`, `npm run dev` y abre `http://localhost:3000`.

## Modelo y seguridad

Las entidades principales son `profiles`, `clients`, `loans`, `installments`, `payments`, `payment_allocations`, `receipts`, `system_settings` y `audit_log`.

El SQL activa RLS en todas las tablas. Los usuarios activos pueden operar la cartera; únicamente `admin` puede administrar perfiles, parámetros generales y modificar el plan de pagos. La función `register_payment` aplica pagos en el orden definido (moratorios, interés, capital) y limita sobrepagos para operadores. `apply_late_fees` recalcula cargos al consultar/registrar un pago; se puede invocar diariamente mediante una Edge Function o `pg_cron`.

> Para producción, expón `register_payment` mediante `supabase.rpc()` y no permitas inserciones directas en `payments`; ajusta las políticas a ese flujo.

## Publicar en Vercel

1. Sube el repositorio a GitHub.
2. En Vercel selecciona **Add New > Project**, importa el repositorio y conserva el preset **Next.js**.
3. En **Environment Variables**, agrega `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` para Production, Preview y Development.
4. Despliega. En Supabase Auth agrega la URL de Vercel en **URL Configuration > Redirect URLs**.

## Pruebas

Ejecuta `npm test` para verificar cálculos de amortización de interés simple y sobre saldo insoluto.

## Pendientes de integración

Las pantallas entregan el flujo visual y el módulo `lib/supabase/client.ts` para conectar Supabase. El siguiente paso es sustituir los datos de demostración por consultas protegidas y conectar los formularios a las funciones SQL.
