# Bug: el moratorio proyectado se "reinflaba" y parecía que los pagos no se registraban

**Fecha:** 2026-09-16
**Reportado en:** CR-2026-00011 ("no está proyectando los intereses a una fecha futura y tampoco está registrando los pagos que se hacen en el plan de pagos")
**Reproducido en:** un crédito de prueba creado para este diagnóstico (CR-2026-00012, borrado después de la prueba)

## Síntoma

En el detalle de un crédito, la tabla de "Parcialidades" y el resumen
"Proyectar moratorios a una fecha" mostraban el moratorio de una cuota como
si nunca se hubiera pagado nada de él, incluso después de registrar un pago
que sí lo cubría (parcial o totalmente). Como el "Saldo total proyectado"
se calcula sumando ese moratorio, el saldo tampoco bajaba lo que debía —
dando la impresión de que el pago "no se registró", aunque el dinero sí
se había cobrado y sí estaba bien guardado en la base de datos.

## Causa raíz

Este bug es la reaparición de uno que ya se había corregido antes (ver
commit `759e3b7`, "...fix de moratorios duplicados"), pero solo se corrigió
en un lado: la función SQL `apply_late_fees()` en Supabase. **Se nos olvidó
corregir su espejo en el frontend**, `projectLateFee()` en
`lib/lateFees.ts`, que sigue el mismo cálculo pero corriendo en Next.js
para poder "proyectar" una fecha hipotética sin escribir en la base de
datos.

Los moratorios se acumulan con una fórmula que siempre calcula el monto
**teórico total** para los días de atraso transcurridos (por ejemplo, tasa
$50/día × 7 días = $350), sin ninguna noción de cuánto de ese moratorio ya
se pagó. La función original tomaba:

```ts
// ANTES (con bug)
const projectedLate = Math.max(currentLateInterestDue, added);
```

Es decir, "lo que ya está guardado" vs. "lo que se acumularía hoy" — y se
quedaba con el mayor. El problema: en cuanto pasa aunque sea un pago
parcial de moratorio, `currentLateInterestDue` (guardado en la base) baja,
pero `added` (el teórico, recalculado desde cero cada vez a partir de los
días de atraso) casi siempre sigue siendo igual o mayor. El `max()`
entonces "gana" con el valor teórico completo, mostrando otra vez el
monto de moratorio como si el pago nunca hubiera existido.

## Corrección

`projectLateFee()` ahora recibe un parámetro nuevo, `paidLate`: la suma de
`payment_allocations.late_amount` ya cobrada para esa parcialidad
específica. En vez de tomar el máximo, **resta** lo ya pagado del monto
teórico acumulado — exactamente la misma lógica que ya tiene
`apply_late_fees()` en SQL desde la corrección anterior:

```ts
// DESPUÉS (corregido)
const projectedLate = Math.max(0, added - paidLate);
```

`app/creditos/[id]/page.tsx` ahora consulta `payment_allocations` por cada
parcialidad del crédito para calcular `paidLate` antes de llamar a
`projectLateFee()`.

## Por qué esto NO era el mismo bug que "no registra pagos" (aclaración)

Al investigar CR-2026-00011 específicamente, los pagos **sí estaban bien
registrados** en la base de datos (verificado directamente: `paid_amount`,
`status` y `outstanding_balance` de esa cuota eran correctos, sumaban
exactamente los dos pagos hechos). Esa cuota nunca tuvo moratorio de por
medio (siempre se pagó a tiempo), así que el bug de arriba no explica ese
caso puntual — probablemente esa impresión vino de otro crédito o de un
momento donde sí había moratorio de por medio. El bug de arriba sí se
reprodujo de forma consistente y verificable con un crédito de prueba
armado específicamente con una cuota vencida.

## Cómo se verificó (extremo a extremo)

Se creó un crédito de prueba real vía la app (mismo camino que usa
cualquier capturista), con una cuota ya vencida a propósito, y se le
aplicaron pagos parciales hasta liquidarlo, confirmando en cada paso que:

1. El moratorio proyectado sí baja cuando se paga (antes se quedaba fijo).
2. `paid_amount` / `status` de cada parcialidad reflejan el pago real.
3. El saldo pendiente (capital) solo baja en la última parcialidad
   (modelo de solo interés).
4. Al liquidar la última parcialidad, el crédito pasa a "Liquidado".

## Lección para no repetir este error

**Cuando exista la misma fórmula de negocio en dos lugares (SQL en
Supabase y su espejo en TypeScript para proyecciones), corregir un bug en
uno de los dos lados y no buscar/corregir el otro dejará el bug vivo a
medias** — visible solo en el lugar que no se tocó. Antes de dar por
cerrado un fix de este tipo:

- Buscar (`grep`) si la misma lógica está duplicada en otro archivo
  (client-side mirror, PDF, reporte, etc.) antes de cerrar el issue.
- Si es posible, extraer la fórmula a una sola función compartida en vez
  de mantener dos implementaciones sincronizadas a mano.
- Escribir una prueba (`lib/lateFees.test.ts`) que cubra explícitamente
  el caso "ya se pagó parte/todo el moratorio" — no solo el caso feliz de
  "nunca se ha pagado nada".
- Verificar con datos reales o un crédito de prueba creado a propósito,
  no solo revisando el código a simple vista.

Ver también `docs/` (si se agregan más post-mortems de este tipo) y
[[vercel-supabase-deploy-gotchas]] en la memoria del asistente para otros
aprendizajes de despliegue de este mismo proyecto.
