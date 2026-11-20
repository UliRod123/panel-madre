<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas de este proyecto (Panel Madre)

Una sola pantalla con cómo va el día en los tres paneles: Producción
(controldeproduccion), Rastreo (panel-de-rastreo) y Pedidos (franjalc-pedidos).
Next.js 16 (App Router, server actions), Prisma 7 + Postgres, en Vercel.

- **Todo en español**: nombres de variables, funciones, modelos, comentarios
  y textos. Los textos de pantalla se escriben como se le hablaría al dueño y a
  las jefas, sin tecnicismos.
- **Solo lee.** El panel madre no escribe en ningún panel ni tiene sus bases:
  pide a cada uno su resumen (`/api/resumen` en Producción y Rastreo, la
  función `resumen-madre` en Pedidos) con una clave compartida. Lo que se ve
  aquí y lo que manda cada panel están en `src/lib/paneles.ts`; si un panel
  cambia su resumen, se cambian los tipos aquí.
- **Un panel caído no tumba a los demás**: cada lectura va por su lado y su
  tarjeta dice qué pasó.
- **La lógica vive en `src/lib/`**. Las acciones de `src/server/` solo leen el
  formulario y llaman a `src/lib/`. Los errores para la persona usan
  `ErrorDeCaptura` (`src/lib/formulario.ts`).
- **Esta base solo guarda cuentas** (`Cuenta`). Migraciones solo aditivas: el
  build corre `scripts/migrar.mjs` contra la base de producción. Crear con
  `npx prisma migrate dev --create-only --name …` y poner al inicio del
  `migration.sql` un comentario en español de para qué es.
- **Revisar antes de entregar**: `npx tsc --noEmit` (si faltan los tipos
  `PageProps`, correr antes `npx next typegen`) y `npx next build`.
- **Pruebas**: scripts en `.pruebas/`, contra un Postgres local en `.env`.
  Correr con `npx tsx --conditions=react-server .pruebas/<archivo>.ts`.
- Actualizar `README.md` cuando cambie cómo se usa algo.
