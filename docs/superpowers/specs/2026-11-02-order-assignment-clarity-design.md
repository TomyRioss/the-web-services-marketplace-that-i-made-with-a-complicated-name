# Claridad de asignacion de pedidos

## Objetivo

Que el cliente pueda reconocer si su pedido espera un desarrollador o ya tiene uno asignado, y habilitar el chat solo despues de la asignacion.

## Alternativas

1. Deshabilitar el boton de chat y mostrar una etiqueta. Es el cambio mas pequeno, pero deja poco claro que debe esperar el cliente.
2. Mostrar un bloque de estado de asignacion en cada pedido y condicionar el acceso al chat. Recomendada: explica el siguiente paso y aplica la regla tanto en la interfaz como en el servidor.

## Diseno

- En Pedidos activos y Mis pedidos, un pedido sin dev muestra «Buscando desarrollador» y «Te avisaremos cuando alguien sea asignado». No ofrece acceso al chat.
- Un pedido asignado muestra el nombre del dev y «Ya podes conversar sobre tu pedido», con la accion «Abrir chat».
- Los pedidos sin dev asignado no aparecen en la lista Chats del cliente.
- El estado operativo existente del pedido se conserva y se muestra aparte del estado de asignacion.
- El servidor bloquea la lectura, escritura y conexion al chat del cliente mientras no exista un dev asignado. El equipo y el dev asignado conservan el acceso permitido actualmente.
- Se usa la paleta del proyecto indicada por el usuario, incluido el acento lima `#C9E94F`, y Michroma para encabezados y CTA.
- El estado vacio de pedidos activos conserva su accion para crear un pedido.

## Validacion

- Revisar pedidos sin asignacion y asignados en el dashboard y en Mis pedidos, en escritorio y movil.
- Confirmar que el cliente no puede abrir, enviar mensajes ni conectarse al chat sin asignacion, incluso con una URL directa.
- Confirmar que la asignacion habilita el chat y muestra el nombre correcto; verificar que el equipo y el dev asignado mantienen acceso.
- Revisar estados vacios, errores y consola durante la navegacion.
