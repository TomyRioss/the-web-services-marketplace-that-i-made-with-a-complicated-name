# Notificaciones del panel

## Objetivo

Mostrar avisos recientes en un dropover desde la campana del panel y notificar por correo al cliente cuando se le asigna un programador, cuando recibe un mensaje del programador o cuando cambia el estado de su pedido.

## Experiencia

- La campana abre un dropover con las cinco notificaciones más recientes del usuario.
- Cada elemento muestra tipo, texto breve, pedido relacionado y fecha. Al seleccionarlo, abre el pedido o chat relacionado y queda leído.
- Un orbe rojo pequeño en la esquina superior derecha de la campana indica que hay notificaciones sin leer.
- El dropover incluye un acceso a la página de notificaciones existente. El estado vacío explica que los avisos aparecerán cuando haya actividad.
- Se conserva la identidad del panel: fondo negro ceniza, superficies gris suave, texto blanco, verde lima `#C9E94F` y Michroma para títulos y CTA.

## Persistencia y destinatarios

Crear una colección privada `ttmcobuild_notifications` en PocketBase. Cada registro pertenece a un perfil y contiene tipo, título, cuerpo breve, destino, pedido relacionado, fecha de creación y fecha opcional de lectura. Las lecturas y escrituras pasan por acciones de servidor autenticadas, igual que los datos actuales.

El destinatario de los tres eventos es el cliente dueño del pedido. La asignación notifica cuando cambia a un programador diferente. El correo de mensaje se envía solo cuando el autor es DEV y el pedido pertenece a un cliente. El cambio de estado notifica cuando el estado efectivamente cambia. Los tres correos usan el envío existente de Resend y `Devta <staff@ttmagencia.com>` como remitente configurado por defecto.

## Flujo y errores

Guardar el aviso en PocketBase al confirmar el evento. Intentar enviar el correo al mismo destinatario; un fallo de Resend no elimina el aviso persistido y se devuelve o registra como error operativo. No enviar correos por asignaciones o estados sin cambios. Revalidar la campana y las pantallas relacionadas después de crear avisos o marcarlos como leídos.

## Verificación de aceptación

- Cliente ve avisos ordenados del más reciente al más antiguo y el orbe desaparece al leer todos.
- Asignar un programador nuevo crea un aviso para el cliente y manda un correo desde la dirección indicada.
- Mensaje escrito por DEV crea un aviso para el cliente y manda un correo; mensajes de otros roles no disparan este evento.
- Cambio real de estado crea un aviso para el cliente y manda un correo; guardar el mismo estado no lo hace.
- Fallo de correo mantiene visible el aviso. Usuario no autenticado o ajeno al pedido no puede consultar, leer ni recibir los registros de otro perfil.
- Dropover usable con teclado, en móvil y escritorio, con estado vacío y errores comprensibles.
