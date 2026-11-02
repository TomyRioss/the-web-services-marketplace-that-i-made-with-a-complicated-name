# Solicitud y pago de pedidos

## Objetivo

Permitir que el equipo acuerde el pago dentro del chat de un pedido y envíe al cliente una acción clara para pagarlo.

## Flujo

1. El cliente y el equipo conversan en el chat del pedido.
2. Un DEV asignado, ADMIN u OWNER inicia «Solicitar pago» y elige Mercado Pago o transferencia bancaria.
3. En pedidos de servicios, se toma el precio vigente al solicitar el pago, incluida una promoción activa. En pedidos personalizados, quien solicita ingresa el importe acordado.
4. Mercado Pago usa ARS y crea una preferencia de Checkout Pro en el servidor. El cliente ve el importe y «Pagar con Mercado Pago», que lo lleva a `init_point`.
5. Para transferencia, se elige ARS o USD. En servicios se usa el precio correspondiente a esa moneda; en pedidos personalizados se ingresa el importe en la moneda elegida. El cliente ve el importe y los datos correspondientes.
6. Cada solicitud se conserva ligada al pedido para mantener historial y evitar que un pago anterior modifique una solicitud nueva. El chat muestra la solicitud vigente y su estado.

## Datos de transferencia

- ARS: alias `tomyrios.dev`, CVU `0000003100060695879699`.
- USD: Tomas Rios, Lead Bank, cuenta `211469172078`, routing `101019644`, Checking (Corriente).

## Permisos

- DEV solo puede solicitar pagos para pedidos que tiene asignados.
- ADMIN y OWNER pueden solicitar pagos para cualquier pedido.
- CLIENTE puede ver la solicitud de su pedido y abrir el pago, pero no cambiar el importe, método ni estado.
- Las acciones de servidor vuelven a validar sesión, rol, pertenencia/asignación y datos de pago antes de actualizar PocketBase o Mercado Pago.

## Pago y estados

- Guardar una solicitud como pendiente no cambia el estado operativo del pedido.
- Una transferencia queda pendiente de confirmación del equipo. ADMIN y OWNER pueden marcarla pagada después de verificarla.
- Un pago de Mercado Pago solo queda pagado después de verificar su estado con Mercado Pago; el regreso del navegador no es prueba de pago. Un webhook firmado actualiza el estado, con consulta al pago usando el identificador recibido.
- Cada solicitud se persiste en una colección PocketBase relacionada con el pedido. Las preferencias usan importe y moneda obtenidos de esa solicitud en servidor, `external_reference` con el ID de la solicitud, una clave de idempotencia y la URL `init_point`.
- Si falta `MP_ACCESS_TOKEN`, la solicitud de Mercado Pago falla con un mensaje accionable y no guarda un enlace inválido.

## Interfaz

- En el chat, mostrar el control «Solicitar pago» a DEV asignado, ADMIN y OWNER.
- El control permite elegir Mercado Pago o transferencia y revisar el importe antes de enviar.
- Para pedidos personalizados, el importe es obligatorio y positivo. Para transferencias, seleccionar ARS o USD.
- El cliente ve una tarjeta de solicitud con importe, método, acción de pago o datos bancarios y estado.
- En errores, conservar la conversación y explicar qué corregir. Estados vacíos no muestran controles de pago al cliente.
- Mantener la identidad actual del panel, responsive, accesible por teclado, acento `#C9E94F` y Michroma en encabezados y CTAs.

## Persistencia

Crear `ttmcobuild_order_payments` con relación al pedido, método, importe, moneda, estado, identificadores de Mercado Pago, solicitante y fechas de creación/confirmación. Los valores permitidos se validan en el servidor. La referencia externa de Mercado Pago es el ID de la solicitud.

## Fuera de alcance

- Crear una aplicación o credenciales de Mercado Pago.
- Convertir USD a ARS automáticamente.
- Recibir, almacenar o verificar comprobantes de transferencia.
- Cambiar el estado de trabajo del pedido al iniciar un pago.

## Verificación

- Confirmar permisos de DEV asignado, ADMIN, OWNER y CLIENTE.
- Comprobar importes de precio regular, promoción activa, pedido personalizado vacío y valor inválido.
- Recorrer solicitud y pago Checkout Pro, moneda ARS/USD de transferencia, datos mostrados, estados pendientes y pagados, error sin credenciales y webhook duplicado.
- Revisar escritorio y móvil, navegación por teclado y consola del navegador en los flujos principales y de error.
