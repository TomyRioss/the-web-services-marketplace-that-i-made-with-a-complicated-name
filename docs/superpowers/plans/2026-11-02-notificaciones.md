# Plan: notificaciones del panel

## Alcance

Persistir notificaciones por usuario, mostrarlas en el dropover del panel y enviar correos al cliente en asignaciones, mensajes de programadores y cambios reales de estado.

## Tareas

1. Revisar las guías de Next.js 16 instaladas y las migraciones actuales de PocketBase. Añadir una colección privada para notificaciones con relación al destinatario, tipo, texto, destino, pedido, fecha y lectura opcional.
2. Añadir acciones de servidor autenticadas para consultar las cinco más recientes, contar pendientes y marcar como leída. Filtrar siempre por el usuario de la sesión.
3. Reutilizar Resend y el remitente configurado `Devta <staff@ttmagencia.com>`. Crear una notificación al cliente y enviar el correo cuando se asigne un nuevo DEV, un DEV escriba en un pedido o cambie el estado. No duplicar eventos sin cambio. Mantener la notificación si falla el correo.
4. Convertir la campana actual en un botón accesible que abre el dropover, con últimos avisos, estado vacío, fecha, acceso a todos y orbe rojo cuando hay pendientes. Marcar como leída al navegar al destino.
5. Completar la página de notificaciones existente con la lista completa y sus estados de lectura.
6. Verificar roles, destinatarios, persistencia ante fallo de correo, estados sin cambios y UI en escritorio/móvil con el servidor ya activo. Revisar consola al recorrer los flujos y eliminar capturas temporales.

## Archivos esperados

- Migración nueva en `pb_migrations/`.
- Acción nueva o extensión acotada en `app/actions/`.
- Ajustes a `app/actions/marketplace.ts` y `app/actions/dashboard.ts`.
- Componente de notificaciones para `components/`.
- Integración de campana en `components/DashboardPillNav.tsx`.
- Lista de notificaciones en `app/(app)/dashboard/notificaciones/`.

## Criterios de aceptación

- Cada cliente ve solo sus avisos, ordenados de más reciente a más antiguo.
- El orbe aparece si hay avisos sin leer y desaparece cuando todos se leen.
- Los tres eventos pedidos generan un aviso persistente y un correo desde staff@ttmagencia.com.
- Reasignar al mismo programador o guardar el estado actual no genera avisos ni correo.
- Fallos del proveedor de correo no borran los avisos.
- Interfaz responsive, navegable con teclado y compatible con el tema actual.
