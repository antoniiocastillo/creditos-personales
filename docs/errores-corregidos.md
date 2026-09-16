# Historial de errores corregidos

Este documento reúne **todos los errores reales encontrados y corregidos**
en Crédito Fácil desde que se conectó a Supabase/Vercel en producción, para
que el equipo (humano o IA) que siga trabajando en este proyecto no los
vuelva a introducir. Cada entrada incluye qué pasó, por qué pasó, cómo se
corrigió y — lo más importante — **qué revisar antes de tocar código
parecido** para no repetirlo.

Los commits referenciados están en `git log` de este repositorio.

---

## 🔴 Errores críticos de dinero/datos

Estos son los más graves: afectaron el cálculo o registro de pagos reales
de clientes reales.

### 1. `register_payment` descartaba el interés cobrado (commit `c971f61`)

**Qué pasó:** al registrar un pago, la parcialidad correspondiente se
quedaba con `paid_amount = 0` y estado "Pendiente" **aunque el dinero sí se
había cobrado** y el saldo del crédito sí bajaba correctamente. Un cliente
podía pagar puntualmente y el sistema seguía marcando la cuota como no
pagada.

**Causa raíz:** la función SQL `register_payment()` calculaba por
separado cuánto del pago iba a moratorio, interés y capital, pero
**reutilizaba la misma variable `x`** para los tres. Al final del cálculo
solo quedaba el último valor (la parte de capital), así que
`paid_amount`, `status` y `payment_allocations` solo reflejaban esa
última parte y descartaban en silencio el interés cobrado. En el modelo
de "solo interés" (donde el capital de las cuotas intermedias es
siempre $0), esto significaba que la cuota **nunca** se marcaba como
pagada, sin importar cuánto interés real se cobrara.

**Corrección:** usar variables separadas (`x_late`, `x_int`, `x_princ`)
y sumarlas (`applied := x_int + x_princ`) para `paid_amount`, el cálculo
de `status`, y para `payment_allocations`.

**Cómo prevenirlo:** cuando una función divide un monto en varias partes
(moratorio/interés/capital, impuestos/subtotal, etc.), **nunca reutilizar
la misma variable para cada parte** si luego se necesita el total o cada
parte por separado. Usar una variable por componente.

### 2. El fix de arriba se "corrigió" solo en el archivo, no en la base de datos real (sin commit — error de proceso)

**Qué pasó:** después de corregir `register_payment` en
`supabase/schema.sql` y hacer commit, **el bug seguía activo en
producción** — tres pagos reales más se registraron mal antes de darnos
cuenta.

**Causa raíz:** `supabase/schema.sql` es solo un script de referencia
para configurar una base de datos nueva. Editarlo y subirlo a git **no
actualiza la base de datos de Supabase que ya está corriendo**. Son dos
sistemas separados sin sincronización automática.

**Corrección:** ejecutar directamente el `create or replace function...`
corregido en el SQL Editor de Supabase (Project → SQL Editor), además de
tenerlo en el repo.

**Cómo prevenirlo:** **toda corrección a una función/policy de Supabase
debe terminar con dos pasos, no uno:** (1) commit del `schema.sql`
actualizado, y (2) ejecutar el mismo SQL directamente contra la base de
datos en producción. Verificar contra datos reales después — nunca dar
por resuelto un bug de base de datos solo por haber editado el archivo.
Ver [[vercel-supabase-deploy-gotchas]] en la memoria del asistente.

### 3. `apply_late_fees` "reinflaba" el moratorio ya pagado (commit `759e3b7`)

**Qué pasó:** si un cliente pagaba parte de su moratorio y luego, el
mismo día, se le volvía a calcular el moratorio (por ejemplo al
registrar un segundo pago), el sistema **le volvía a cobrar el moratorio
completo**, ignorando lo ya pagado. Dos pagos de un cliente cayeron
completos en moratorio en vez de abonar a capital, aunque ya había
cubierto ese moratorio con el primer pago.

**Causa raíz:** la función tomaba `greatest(moratorio_guardado,
moratorio_teorico_del_dia)` — el máximo entre lo que ya había en la base
y el cálculo teórico fresco. El cálculo teórico no tiene memoria de
pagos previos, así que en cuanto era mayor que el saldo ya reducido, el
`greatest()` "ganaba" con el valor completo otra vez.

**Corrección:** en vez de tomar el máximo, restar del monto teórico lo
que ya se pagó de moratorio (`sum(payment_allocations.late_amount)` de
esa parcialidad): `late_interest_due = greatest(0, teorico - ya_pagado)`.

**Cómo prevenirlo:** cualquier cálculo de "monto acumulado con el
tiempo" (moratorios, intereses moratorios, recargos) debe **restar
explícitamente lo ya pagado**, nunca usar `max()`/`greatest()` entre el
valor guardado y un recálculo teórico independiente del historial de
pagos.

### 4. El mismo bug de moratorios existía duplicado en el frontend y no se corrigió ahí (commit `b9ab923`)

**Qué pasó:** después de corregir el bug #3 en SQL, la pantalla
"Proyectar moratorios a una fecha" **seguía mostrando el moratorio
reinflado**, dando la impresión de que un pago no se había registrado
(aunque en la base de datos sí estaba correcto).

**Causa raíz:** `lib/lateFees.ts` (`projectLateFee`) es un "espejo" en
TypeScript de la lógica de `apply_late_fees()` en SQL, usado para
proyectar una fecha hipotética sin escribir en la base de datos. Tenía
**exactamente el mismo bug del `max()`** que el #3, pero al corregir el
SQL nadie buscó si la misma fórmula estaba duplicada en otro lado.

**Corrección:** aplicar la misma corrección (restar `paidLate` en vez de
tomar el máximo) en `projectLateFee()`, y agregar `lib/lateFees.test.ts`
para que un test cubra este caso explícitamente. Detalle completo en
[`docs/moratorios-y-pagos-fix.md`](./moratorios-y-pagos-fix.md).

**Cómo prevenirlo:** **cuando la misma regla de negocio existe en dos
lugares** (SQL + su espejo en JS, o backend + PDF, etc.), corregir un
bug en un lado y no buscar (`grep`) el otro lado dentro del mismo commit
es corregirlo solo a medias. Antes de cerrar un fix de este tipo:
1. Buscar en todo el repo si la misma fórmula/lógica está duplicada.
2. Si es posible, extraerla a una sola función compartida.
3. Escribir una prueba que cubra el caso que causó el bug.
4. Verificar con datos reales o un crédito de prueba, no solo leyendo el código.

### 5. Se podía cancelar un crédito con saldo pendiente real (commit `73d9b11`)

**Qué pasó:** un crédito real (CR-2026-00005) con pagos ya aplicados y
saldo pendiente fue cancelado, y el sistema **dejó de darle seguimiento**
a esa deuda real — como si nunca hubiera existido.

**Causa raíz:** `cancelLoanAction` no verificaba si el crédito todavía
tenía saldo pendiente antes de permitir la cancelación.

**Corrección:** bloquear la cancelación en el servidor
(`cancelLoanAction`) si `outstanding_balance > 0`, sin importar quién la
llame ni desde dónde. La interfaz ahora muestra una advertencia en vez
del botón de cancelar cuando hay saldo pendiente.

**Cómo prevenirlo:** cualquier acción irreversible sobre datos
financieros (cancelar, eliminar, cerrar) debe validar sus precondiciones
**en el servidor**, no solo ocultando el botón en la interfaz — la
interfaz se puede evitar, la validación del servidor no.

### 6. Faltaban políticas de RLS para `installments` (sin commit — corregido con SQL directo)

**Qué pasó:** créditos se creaban con **cero parcialidades**, en
silencio (sin error visible). Después, editar un crédito fallaba con
`duplicate key value violates unique constraint`.

**Causa raíz:** faltaba una política de `INSERT` en `installments` (por
eso no se insertaban las parcialidades al crear el crédito) y una de
`DELETE` (por eso no se podían borrar las parcialidades viejas al
editar, antes de regenerarlas).

**Corrección:** agregar ambas políticas RLS en Supabase.

**Cómo prevenirlo:** cuando una tabla tiene RLS activado, **debe existir
una política explícita por cada operación que la aplicación necesite
hacer** (`select`, `insert`, `update`, `delete`) — no asumir que
"activar RLS" con una sola política de lectura es suficiente. Probar
cada flujo (crear, editar, cancelar) con RLS activo antes de dar por
terminada una tabla nueva.

---

## 🔐 Errores de seguridad

### 7. La API key **secreta** de Supabase quedó expuesta en el navegador (sin commit — corregido en Vercel/Supabase directamente)

**Qué pasó:** durante ~13 días, la variable `NEXT_PUBLIC_SUPABASE_ANON_KEY`
en Vercel tenía puesta una **secret key** (`sb_secret_...`, equivalente al
antiguo `service_role`, con acceso total a la base de datos sin RLS) en
vez de la **publishable key** (`sb_publishable_...`, diseñada para ser
pública). Como la variable tiene el prefijo `NEXT_PUBLIC_`, Next.js la
incluye tal cual en el JavaScript que se manda a cada visitante —
cualquiera pudo haber tenido acceso total a la base de datos abriendo las
herramientas de desarrollador del navegador.

**Cómo se detectó:** revisando la consola del navegador, la conexión de
Supabase Realtime se ve así: `wss://...supabase.co/realtime/v1/websocket?apikey=...`
— el valor de `apikey=` en esa URL es exactamente lo que el navegador
tiene cargado. Si empieza con `sb_secret_`, hay una fuga.

**Corrección:**
1. Se creó una key secreta nueva en Supabase y se puso en
   `SUPABASE_SERVICE_ROLE_KEY` (uso exclusivo del servidor).
2. Se puso la key **publishable** correcta en
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Se **revocó/eliminó** la key secreta filtrada en Supabase (Settings →
   API Keys → Delete), inutilizándola por completo aunque alguien la
   tuviera guardada.

**Cómo prevenirlo:**
- Cualquier variable con prefijo `NEXT_PUBLIC_` **se considera pública
  para siempre** — nunca poner ahí una key con privilegios elevados,
  contraseñas, ni tokens de servidor.
- Al configurar variables de entorno nuevas, verificar dos veces cuál
  key va en cuál variable: `sb_publishable_...` / `anon` → variables
  `NEXT_PUBLIC_*`; `sb_secret_...` / `service_role` → variables sin ese
  prefijo, solo usadas en Server Actions/Route Handlers.
- Revisar periódicamente la consola del navegador de la app en
  producción (buscando `apikey=sb_secret_` en cualquier request) como
  chequeo rápido de que no haya una fuga.

Detalle completo del incidente y la corrección en la memoria del
asistente ([[vercel-supabase-deploy-gotchas]]).

---

## 🚀 Errores de despliegue/infraestructura

### 8. El botón "Redeploy" de Vercel mantenía la key vieja después de cambiarla (sin commit)

**Qué pasó:** después de corregir el error #7 y darle "Redeploy" desde
el panel de Vercel, **la app seguía usando la key vieja** — el toast
decía "Updated Environment Variable successfully" y el deployment
mostraba "Ready", pero el JavaScript publicado seguía teniendo el valor
anterior.

**Causa raíz:** el "Redeploy" del dashboard de Vercel puede reutilizar
la caché de build. Next.js incluye las variables `NEXT_PUBLIC_*`
directamente en el código en el momento de compilar (`build time`); si
Vercel reutiliza un build en caché, no vuelve a "hornear" esas
variables aunque hayan cambiado.

**Corrección:** desplegar con `npx vercel --prod --yes --force`, que
ignora la caché de build por completo.

**Cómo prevenirlo:** **después de cambiar cualquier variable
`NEXT_PUBLIC_*`, desplegar siempre con `--force`** (por CLI) en vez de
confiar solo en el botón "Redeploy" del dashboard. Para confirmar que
un valor `NEXT_PUBLIC_*` sí cambió en producción, no basta con ver
`vercel env ls` (no muestra el valor ni la fecha real de edición) — hay
que revisar el JavaScript publicado directamente (o, más simple, el
`apikey=` de la conexión Realtime en la consola del navegador).

### 9. Variables de entorno tipo "Secret" no se pueden volver a verificar (sin commit)

**Qué pasó:** al no poder ver el valor guardado de
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (tipo "Secret" en Vercel), fue imposible
confirmar si el problema era que el valor pegado estaba mal o que el
build no lo había tomado — costó varios intentos de diagnóstico.

**Corrección:** cambiar el tipo de esa variable a **"Config"** (permite
volver a ver el valor después), dejando "Secret" solo para valores que
de verdad nunca deben volver a mostrarse (`SUPABASE_SERVICE_ROLE_KEY`).

**Cómo prevenirlo:** usar **"Config"** para cualquier variable que sea
segura de exponer (keys públicas, URLs, flags) — así se puede verificar
después. Reservar **"Secret"** solo para credenciales verdaderamente
sensibles (contraseñas, service role keys, tokens).

### 10. Faltaban los assets de `pdfkit`/`@react-pdf` en el build serverless (commit `7ddfdef`)

**Qué pasó:** generar el Estado de Cuenta o el Pagaré en PDF fallaba en
producción con `Cannot find module '.../pdfkit/js/standard-fonts/Helvetica.cjs'`,
aunque funcionaba en local.

**Causa raíz:** Vercel usa un "file tracer" para decidir qué archivos
incluir en cada función serverless, y no detecta automáticamente los
assets de fuentes que `pdfkit` carga dinámicamente con `require()`.

**Corrección:** agregar `outputFileTracingIncludes` en `next.config.mjs`
para las rutas que generan PDF, apuntando explícitamente a
`node_modules/pdfkit/**/*`, `node_modules/fontkit/**/*` y
`node_modules/@react-pdf/**/*`.

**Cómo prevenirlo:** cualquier librería que cargue archivos con
`require()` dinámico (fuentes, plantillas, binarios) en una ruta que
correrá como función serverless en Vercel necesita revisarse contra
`outputFileTracingIncludes` — el hecho de que funcione en local no
garantiza que Vercel incluya esos archivos en el deploy.

### 11. Timeout de Supabase Auth tumbaba el middleware completo (commit `c450de9`)

**Qué pasó:** al cerrar sesión, a veces aparecía un error de Vercel
`MIDDLEWARE_INVOCATION_TIMEOUT` (504) en vez de regresar al login.

**Causa raíz:** el middleware llamaba a `supabase.auth.getUser()` sin
límite de tiempo; si la llamada a Supabase se tardaba, Vercel mataba
toda la función de middleware con un 504 genérico.

**Corrección:** envolver la llamada en un `Promise.race` con un timeout
de 8 segundos que, si se cumple, trata al usuario como no autenticado
(falla "seguro": redirige a login) en vez de tronar la petición.

**Cómo prevenirlo:** cualquier llamada de red dentro de un middleware de
Next.js (que corre en el Edge con límites de tiempo estrictos) debe
tener su propio timeout explícito y un comportamiento de "falla segura"
definido — nunca dejar que una dependencia externa lenta tumbe todo el
middleware.

---

## 🎨 Errores de interfaz (menores, pero documentados por si se repite el patrón)

### 12. `margin: auto` centraba el contenido también verticalmente (commits `9b35318`, `1867a6c`)

**Qué pasó:** aparecía un espacio vacío grande arriba y abajo del
contenido de cada página.

**Causa raíz:** `.page { margin: auto; }` centra en **ambos ejes**, no
solo el horizontal — dentro de una fila de CSS Grid con más altura
disponible, el contenido quedaba centrado verticalmente en vez de
pegado arriba.

**Corrección:** `margin: 0 auto;` (explícito: sin margen vertical, auto
solo en horizontal).

**Cómo prevenirlo:** al centrar un bloque horizontalmente, usar siempre
`margin: 0 auto` explícito — nunca `margin: auto` a secas, que centra en
las dos direcciones y solo "se nota" cuando el contenedor tiene altura
extra disponible (por eso este bug pasó desapercibido un tiempo).

### 13. El texto del menú faltaba de negritas al navegar (commit `a872d60`)

**Qué pasó:** los textos del menú lateral "brincaban" de posición al
cambiar de sección activa.

**Causa raíz:** el estado activo del link cambiaba su `font-weight`,
y una fuente en negritas ocupa más ancho que la misma en regular — el
texto se movía ligeramente al cambiar el ancho del elemento.

**Corrección:** mantener el mismo `font-weight` (600) siempre; distinguir
el estado activo solo con color y fondo, nunca con grosor de fuente en
elementos de navegación.

**Cómo prevenirlo:** evitar cambiar `font-weight` en estados
interactivos (hover/activo) de elementos que deben mantener su tamaño
estable (menús, tabs, botones en fila) — usar color, fondo o un
subrayado en vez de negritas para indicar el estado activo.

### 14. `statusLabel` de instalación se usaba para el estado del crédito (sin commit registrado — corregido junto con otros cambios)

**Qué pasó:** el detalle de un crédito mostraba el estado en inglés sin
traducir (por ejemplo "active" en vez de "Activo").

**Causa raíz:** existían dos diccionarios de traducción de estado
(`installmentStatusLabel` para parcialidades, `loanStatusLabel` para
créditos) y por error se usaba el de parcialidades para mostrar el
estado del crédito completo — como los valores no coinciden
(`'active'` no existe en el diccionario de parcialidades), se mostraba
el valor crudo de la base de datos.

**Corrección:** usar el diccionario correcto en cada contexto; después,
en `759e3b7`, se consolidaron todos los diccionarios de traducción
(`methodLabel`, `loanStatusLabel`, `installmentStatusLabel`) en un solo
archivo compartido (`lib/labels.ts`) para no volver a tener copias
sueltas que se puedan confundir entre sí.

**Cómo prevenirlo:** cuando existan varios diccionarios de traducción
parecidos (mismo tipo de dato, distinto significado — como "estado de
crédito" vs. "estado de parcialidad"), ponerles nombres que dejen claro
cuál es cuál (no llamar a ambos genéricamente `statusLabel`), o mejor,
centralizarlos en un solo archivo compartido desde el principio.

### 15. Los reportes CSV mostraban los valores en inglés (`cash`, `transfer`, `active`) (commit `759e3b7`)

**Qué pasó:** los reportes exportables (`/reportes/export`) mostraban el
método de pago y el estado del crédito tal cual vienen de la base de
datos (en inglés), aunque en la interfaz normal ya se veían traducidos.

**Causa raíz:** la traducción (`methodLabel`, `loanStatusLabel`) estaba
duplicada dentro de cada página que la necesitaba, y nadie la agregó
también en la ruta de exportación de CSV cuando se creó.

**Corrección:** centralizar las traducciones en `lib/labels.ts` y
aplicarlas también en `app/reportes/export/route.ts`.

**Cómo prevenirlo:** cuando se agregue una traducción/formateo de un
valor que viene de la base de datos, buscar (`grep`) **todos los
lugares** donde ese mismo campo se muestra al usuario (pantalla, PDF,
CSV, reportes) — no solo la pantalla donde se detectó el problema
originalmente.

---

## ✅ Checklist rápido antes de dar por cerrado un fix

Basado en los patrones de arriba, antes de marcar un bug como resuelto:

1. **¿El fix es de SQL/Supabase?** → ¿ya se ejecutó directamente en la
   base de datos de producción, no solo en `schema.sql`?
2. **¿La misma lógica existe en otro lugar?** (espejo en JS, PDF,
   reporte, CSV) → buscarlo con `grep` y corregirlo ahí también.
3. **¿Cambié una variable de entorno `NEXT_PUBLIC_*`?** → desplegar con
   `--force` y confirmar el valor nuevo en el navegador, no solo confiar
   en el mensaje de éxito de Vercel.
4. **¿Es una acción irreversible sobre dinero real** (cancelar, borrar,
   editar un crédito con pagos)? → la validación tiene que estar en el
   servidor, no solo ocultando el botón.
5. **¿Escribí una prueba** que cubra específicamente el caso que causó
   el bug (no solo el caso feliz)?
6. **¿Lo verifiqué con datos reales o un crédito de prueba** creado a
   propósito, de principio a fin, no solo leyendo el código?
