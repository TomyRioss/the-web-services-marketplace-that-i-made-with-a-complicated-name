# Solicitud y pago de pedidos

## Objetivo

Permitir que el equipo acuerde el pago dentro del chat de un pedido y envíe al cliente una acción clara para pagarlo.

## Flujo

1. El cliente conversa y envía comprobantes como imágenes en el chat del pedido.
2. ADMIN u OWNER gestiona pagos y conversación con el cliente. DEV solo recibe el pedido y la nota de delegación.
3. Al solicitar una transferencia, ADMIN u OWNER elige ARS o USD. En servicios se usa el precio vigente para esa moneda, incluida la promoción activa; en pedidos personalizados se ingresa el importe acordado.
4. El sistema envía al chat el importe y los datos bancarios de la moneda elegida.
5. Cada solicitud queda ligada al pedido. ADMIN u OWNER confirma la recepción después de revisar el comprobante.
## Datos de transferencia

- ARS: Tomas Rios, alias `tomyrios.mp`, CVU `0000003100068327389046`.
- USD: Tomas Rios, Lead Bank, cuenta `211469172078`, routing `101019644`, Checking (Corriente).
## Permisos

- Solo ADMIN y OWNER pueden gestionar pagos y mensajes con clientes.
- DEV solo ve pedidos asignados y notas de delegación.
- CLIENTE puede ver los datos de transferencia y enviar el comprobante como imagen; no puede cambiar el importe ni el estado.
## Pago y estados

- Guardar una solicitud como pendiente no cambia el estado operativo del pedido.
- Una transferencia queda pendiente de confirmación del equipo. ADMIN y OWNER pueden marcarla pagada después de verificarla.
- Cada solicitud de transferencia se persiste en una colección PocketBase relacionada con el pedido, con moneda, importe, estado, solicitante y fechas de creación y confirmación.

## Interfaz

- En el chat, mostrar el control «Solicitar pago» a DEV asignado, ADMIN y OWNER.
- Para pedidos personalizados, el importe es obligatorio y positivo. Para transferencias, seleccionar ARS o USD.
- El cliente ve una tarjeta de solicitud con importe, método, acción de pago o datos bancarios y estado.
- En errores, conservar la conversación y explicar qué corregir. Estados vacíos no muestran controles de pago al cliente.
- Mantener la identidad actual del panel, responsive, accesible por teclado, acento `#C9E94F` y Michroma en encabezados y CTAs.


## Fuera de alcance

- Convertir USD a ARS automáticamente.
- Recibir, almacenar o verificar comprobantes de transferencia.
- Cambiar el estado de trabajo del pedido al iniciar un pago.

## Verificación

- Confirmar permisos de DEV asignado, ADMIN, OWNER y CLIENTE.
- Comprobar importes de precio regular, promoción activa, pedido personalizado vacío y valor inválido.
- Revisar escritorio y móvil, navegación por teclado y consola del navegador en los flujos principales y de error.

## Regresión de promociones

- V1: Precio promo USD conserva descuento proporcional y redondea a centavos.
- V2: Crear, editar o borrar servicio invalida todas las listas, detalles y vistas de pago que muestran precio vigente.
- B1|2026-11-02|USD promo redondeado a entero y vistas de precio fuera de la revalidación|V1,V2

## Regresión de instrucciones de transferencia

- V3: Al crear una transferencia, el chat recibe importe y datos de cuenta como un mensaje; la tarjeta de pago no duplica datos ni ofrece botones para copiarlos.
- B2|2026-11-02|La tarjeta exponía datos bancarios con controles de copia en vez de enviarlos al chat|V3

- V4: Cancelar una transferencia pendiente la deja no pagable y la quita de la lista visible de solicitudes.
- B3|2026-11-02|No existía cancelación real de transferencia y la solicitud seguía visible|V4

