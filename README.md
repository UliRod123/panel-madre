# Panel Madre

Cómo va el día en **Producción**, **Rastreo** y **Pedidos**, en una sola
pantalla y sin abrir cada panel. Es para el dueño y las jefas: cada quien entra
con su usuario y su PIN, y todos ven lo mismo.

- **/panel** (Hoy): arriba, **Lo que hay que ver** — lo atorado en los tres
  paneles, lo más grave primero (entregas que no se pudieron, pedidos
  atrasados, pedidos de días anteriores por retomar…). Abajo, una tarjeta por
  panel con sus cifras de hoy y el botón **Abrir** que lleva a ese panel.
  Se actualiza sola cada minuto mientras se tenga a la vista.
- **/panel/cuentas** (solo el dueño): dar de alta a las jefas, cambiar PIN,
  desactivar cuentas.

## Cómo funciona

El panel madre **no tiene los datos** ni entra a las bases de los otros
paneles. A cada uno le pide su resumen ya contado, de solo lectura, con una
clave que comparten:

| Panel | De dónde lee | Clave aquí | Clave allá |
|---|---|---|---|
| Producción | `https://controldeproduccion.vercel.app/api/resumen` | `RESUMEN_SECRETO_PRODUCCION` | `RESUMEN_SECRETO` en Vercel de Producción |
| Rastreo | `https://panel-de-rastreo.vercel.app/api/resumen` | `RESUMEN_SECRETO_RASTREO` | `RESUMEN_SECRETO` en Vercel de Rastreo |
| Pedidos | función `resumen-madre` de Supabase | `RESUMEN_SECRETO_PEDIDOS` | secreto `RESUMEN_SECRETO` de la función en Supabase |

Si un panel no contesta o la clave no coincide, su tarjeta lo dice y los otros
dos se siguen viendo igual. Ninguno de los tres paneles cambia su forma de
trabajar.

De Pedidos solo llegan folio, producto, etapa y días de retraso; nada del
cliente ni de su graduación. Cada pedido atrasado abre directo en la app de
Pedidos, con su sesión de siempre.

## Publicar

1. **Los tres paneles con su resumen.** Llevar a `main` las ramas que agregan
   el resumen en `panel-de-cajas` y `panel-de-rastreo`. En Pedidos, aplicar la
   migración `0057_resumen_para_el_panel_madre.sql` y desplegar la función
   `resumen-madre` con `verify_jwt: false` (ver su README).
2. **Tres claves**, una por panel: `openssl rand -base64 32` tres veces.
   - En Vercel de Producción: `RESUMEN_SECRETO` = clave 1.
   - En Vercel de Rastreo: `RESUMEN_SECRETO` = clave 2.
   - En Supabase (Pedidos): `supabase secrets set RESUMEN_SECRETO=<clave 3>`.
   Volver a desplegar Producción y Rastreo para que tomen la variable.
3. **Este proyecto en Vercel**: importar el repositorio, crear una base Postgres
   nueva desde Storage (no la de ningún otro panel) y poner:
   - `AUTH_SECRET` (`openssl rand -base64 32`), `ZONA_HORARIA=America/Mexico_City`
   - `RESUMEN_SECRETO_PRODUCCION` = clave 1, `RESUMEN_SECRETO_RASTREO` = clave 2,
     `RESUMEN_SECRETO_PEDIDOS` = clave 3
   - Opcional: `CLAVE_INSTALACION`, que se pide en el primer arranque.
   Las direcciones de los paneles ya vienen puestas; solo se cambian
   (`PRODUCCION_URL`, `RASTREO_URL`, `PEDIDOS_URL`, `PEDIDOS_RESUMEN_URL`) si
   alguno cambia de dominio.
4. Desplegar: el build aplica las migraciones solo (`scripts/migrar.mjs`).
5. Abrir la dirección: sale **Primer arranque** para crear la cuenta del dueño.
   Desaparece en cuanto se guarda. Después, en **Cuentas**, dar de alta a
   Meche, Marisol y las demás.

Las claves nunca van en el código ni en el chat: solo en Vercel y en Supabase.

## Local

```bash
npm install
npx prisma migrate deploy
npm run dev
```

`.env` necesita `DATABASE_URL` hacia un Postgres local. Para ver tarjetas con
datos, apuntar `PRODUCCION_URL` / `RASTREO_URL` a los otros paneles corriendo en
local con la misma `RESUMEN_SECRETO`.

Pruebas (cuentas, freno de PIN, lectura de los tres con un panel caído):

```bash
npx tsx --conditions=react-server .pruebas/cuentas-y-resumen.ts
```

Antes de entregar: `npx tsc --noEmit` y `npx next build`.
