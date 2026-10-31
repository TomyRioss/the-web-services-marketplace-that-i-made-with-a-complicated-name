# Devta

Marketplace de servicios de programación web. Los clientes exploran el catálogo y envían pedidos; el equipo administra publicaciones, usuarios y estados.

## Desarrollo

- `npm run dev`: inicia Next.js.
- `npm run build`: genera la versión de producción.
- `npm run lint`: revisa el código.

## Base de datos

La aplicación usa PocketBase. Configurá `POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD` y `SESSION_SECRET` en las variables privadas del entorno. Nunca uses prefijos `NEXT_PUBLIC_` para estos valores.

Las colecciones privadas se crean con la migración en `pb_migrations`. La base SQLite anterior se conserva en `migration-source/ttmcobuild.sqlite` como fuente hasta completar la transferencia. Ejecutá `npm run migrate:sqlite-pocketbase` con la URL y el usuario superadmin de PocketBase configurados en `.env.local`.
