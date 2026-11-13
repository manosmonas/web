# Club Monas · MVP de puntos y recompensas

**Web:** https://manosmonas.github.io/web/puntos/  
**Demo funcional sin base de datos:** https://manosmonas.github.io/web/puntos/?demo=1

La web comercial existente `/web/` permanece intacta; todo el MVP reside dentro de `/web/puntos/`.

## Funciona ahora (11/11/2026)
- Diseño responsivo React para navegador de computadora y celular.
- Inicio de sesión real con Google y Facebook mediante Firebase Authentication, sujeto a la configuración del proveedor Meta.
- Botón visible de cerrar sesión; encabezado, perfil, recompensas y menú.
- Código de rol `clienta` vs `jefa` autorizado por `admins/{uid}.enabled === true`; **no basta con mostrar un botón**.
- Registro de servicios por la jefa con catálogo de puntos fijo, transacción atómica y documento de visita inmutable.
- Solicitud de canje por clienta; la jefa aprueba o rechaza, y el saldo se descuenta de forma atómica al aprobar.
- Historial de visitas y solicitudes, contadores y estados de canje.
- **Anulación de atención:** disponible en el panel de la jefa desde la URL normal, con motivo obligatorio y transacción atómica que resta puntos y una visita sin borrar la atención original. El documento `voids/void-{visitId}` es inmutable y evita anulaciones repetidas; no permite saldos negativos. El propietario confirmó que el flujo funcionó con su Firebase real.
- Modo DEMO por `?demo=1` para recorrer el flujo completo: entrar como clienta → solicitar premio → cambiar a jefa → aprobar → registrar servicio → volver a clienta. No se guarda ningún dato real.

**Actualización 11/11/2026:** el propietario confirmó la creación de Firestore `(default)` en Chile, la publicación de las reglas, el registro de la jefa y las pruebas reales de acreditación, anulación y aprobación de un canje. La versión de las reglas publicada en Firebase no puede leerse directamente desde esta sesión; no sustituye una auditoría antes de abrir al público.

**La consulta de saldo y visitas funciona con Firestore en tiempo real también en** `https://manosmonas.github.io/web/puntos/`. **Las clientas pueden solicitar canjes desde la URL habitual**, con una confirmación previa. La solicitud se guarda como `pending` sin descontar puntos y aparece en su perfil. La jefa puede **aprobar o rechazar canjes pendientes desde la URL habitual**, siempre que Firestore la reconozca como administradora. Al aprobar, una transacción descuenta puntos y actualiza el estado; al rechazar no descuenta. `?demo=1` sigue siendo simulación. El perfil se vincula al UID de la sesión Firebase y deja de mostrar cero mientras espera una lectura real. **La jefa puede registrar y anular atenciones desde la URL normal**. No anunciar el lanzamiento público hasta finalizar las pruebas de permisos, condiciones del programa y revisión de cuentas. Las reglas del archivo GitHub **no se publican automáticamente** en Firebase.

## Activación final de Firebase (completada parcialmente; verificar en orden)
1. En el proyecto **manos-monas-puntos**, crear **Cloud Firestore** en modo producción. La aplicación Firebase Web ya está registrada.
2. En Firestore → **Rules**, pegar y **publicar** el contenido completo de `puntos/firestore.rules` desde GitHub. No habilitar reglas de prueba que permitan acceso público. Las reglas verifican roles y validan cada cambio de puntos contra la creación de una visita o la aprobación de un canje, mediante `getAfter()`.
3. Entrar al Club Monas con la cuenta Google/Facebook de la **jefa** para obtener su UID desde Firebase → Authentication → Users. En Firestore crear la colección `admins`, documento con ID **exactamente igual a su UID**, campo `enabled` tipo **boolean** con valor `true`. Debe existir **únicamente** para cuentas autorizadas; la jefa puede crear su perfil al iniciar sesión tras activar la base de datos.
4. **Conexión y operaciones activadas desde la URL habitual:** `window.MANOS_MONAS_ENABLE_DATA = true` y `window.MANOS_MONAS_ENABLE_WRITES = true`. Las reglas de Firestore y el documento `admins/{uid}` siguen siendo los controles de seguridad: la interfaz no concede permisos por sí sola. `?demo=1` continúa como simulación aislada.
5. Probar con **dos cuentas distintas**: (a) clienta, que no puede acreditar puntos, (b) jefa, que sí. La jefa registra una manicura y suma 30 puntos; clienta ve historial; con saldo suficiente solicita premio; jefa lo aprueba y se descuentan puntos. Verificar que una solicitud solo se procese una vez y que no se puedan gastar puntos negativos.
6. Realizar pruebas de seguridad con el emulador de Firebase y revisar las reglas antes de abrir a todas las clientas. **La lógica está escrita, pero las reglas aún no han sido probadas contra Firestore real por el asistente**.
7. Definir/confirmar importes y premios ANTES de habilitar el programa real. Los valores actuales son meramente de prueba. Los valores en las reglas y en la web deben mantenerse idénticos.
8. Configurar alertas de uso/costos de Firebase y probar errores de conexión y cierre de sesión.

**Canjes: actualización 11/11/2026.** La clienta pulsa «Solicitar canje» y confirma; Firestore registra `redemptions/{id}` con `status=pending`, sin descontar saldo. La jefa aprueba o rechaza desde la URL normal. El propietario confirmó que el flujo de aprobación y descuento funcionó con su Firebase real. En la simulación también se validaron el rechazo, saldo insuficiente y solicitud ya procesada; faltan pruebas reales negativas con cuentas independientes. Los pendientes duplicados del mismo premio se evitan en la interfaz, pero falta protección atómica interdispositivos.

## Flujo de canje acordado para el MVP (presencial)

**Decisión del negocio (11/11/2026): mantener este flujo sin añadir estados ni reservas por ahora.**

1. La clienta llega físicamente a Manos Monas Home Studio y muestra que tiene puntos suficientes para una recompensa desbloqueada.
2. La clienta comunica que desea canjear ese premio y solicita el canje desde su cuenta.
3. La jefa comprueba la solicitud en **Canjes pendientes** y la **aprueba**.
4. Al aprobarla, Firebase descuenta los puntos y el personal **realiza el servicio en el salón**. Si la jefa rechaza, el saldo no cambia.

En esta fase, **«Aprobada» es el estado final necesario**; no crear un estado adicional «Entregada» ni un sistema de comprobantes de entrega. **Reservas queda pendiente para una etapa posterior**, cuando se quiera permitir agendar un servicio después de que el canje esté aprobado. No modificar el flujo de canje presencial para introducir reservas antes de esa etapa.

**Activación de operación desde URL normal (11/11/2026):** habilitados los botones «Acreditar puntos» y «Anular atención» sin parámetros `?live` o `?void`. La jefa debe comprobar una vez que ambos aparecen y funcionan en la dirección habitual. No cambia las reglas publicadas ni la web comercial.

## Créditos de desarrollo y publicidad

**Decisión de marca:** toda publicidad de Manos Monas Club debe incluir el crédito visible **«Software desarrollado por AGNE»** (Agilidad para Negocios).

- [ ] Incluir el crédito en flyers, videos, reels, historias, banners, anuncios y piezas de lanzamiento de la aplicación, incluida la campaña navideña.
- [ ] Mantener el crédito legible y consistente, sin desplazar la identidad principal de Manos Monas Club.
- [ ] Revisar las piezas existentes antes de publicarlas y agregar el crédito cuando falte.

## Notificaciones push (pendiente de activación)

**Decisión 12/11/2026:** configurar un canal de notificaciones de Club Monas para avisos de servicio y campañas promocionales, en web y futura app móvil. No limitarlo a recordatorios de reservas.

- [ ] Activar Firebase Cloud Messaging (FCM), configurar Web Push y VAPID, desplegar las funciones programadas y reglas necesarias en el proyecto existente `manos-monas-puntos`; validar permisos, entrega en Android/iOS y navegador, costos y seguridad.
- [ ] Recordatorios de citas a las 8:00 a. m. del mismo día y una hora antes (America/Lima). La lógica está preparada en `feature/reservas-mvp`, pero no desplegada. Actualizar ante cambios de horario y cancelar avisos de citas anuladas; evitar duplicados.
- [ ] Avisos transaccionales: reserva confirmada, reagendamiento confirmado o solicitado (según rol), cancelación, puntos acreditados, recompensa desbloqueada, canje aprobado o rechazado.
- [ ] Promociones: permitir a la jefa preparar y enviar campañas de Manos Monas (ofertas, novedades y promociones especiales), con título, mensaje, enlace a la app y envío inmediato o programado. Incorporar vista previa y confirmación antes de enviar.
- [ ] Permitir segmentar promociones por preferencias y consentimiento; gestionar suscripciones y tokens por dispositivo, baja de promociones, frecuencia y horario razonables. Separar avisos de servicio de publicidad, y no exponer datos personales en la pantalla bloqueada.
- [ ] Probar notificaciones con la app abierta y cerrada, manejo de permisos denegados, dispositivos compartidos, cierre de sesión y cambios de cuenta.
- [ ] Futuro: avisos de nuevas citas y cambios para Doris y Miluzka. Por ahora no notificar a las especialistas.

**Estado:** tarea registrada; no se han habilitado ni enviado notificaciones push reales. La vista de reservas y la activación simulada están en la demo; el backend de recordatorios está preparado en la rama de reservas. Mantener intacta la web comercial y el flujo presencial de canje.

## Otras tareas para después del MVP
- Corregir carga de foto de perfil (actualmente puede mostrar monita de reserva).
- Resolver aviso rojo de Facebook en Meta, completar revisión, permisos y publicación para usuarios sin rol de pruebas. **No ofrecer Facebook Login al público si persiste ese aviso.**
- Manejar vinculación de una misma clienta que ingresa con Google y Facebook usando el mismo correo (evitar perfiles duplicados).
- Reservas y políticas de privacidad para lanzamiento; app nativa Android/iOS con Expo/React Native; dominio `manosmonas.com` después de terminar.
- Extraer código CDN a módulos React+TypeScript y agregar pruebas automatizadas al evolucionar del MVP.

## Catálogo de prueba (NO comercial)
- Servicios y puntos por atención: manicura 30; pedicura 40; pestañas 50; mechas 90; alisado 110.
- Premios: manicura clásica 200; pedicura clásica 400; lifting 650; descuento en alisado 1000.

## Seguridad y límites
- GitHub Pages solo sirve archivos estáticos. El rol y las reglas de acceso se hacen cumplir mediante Firebase Firestore, no en el navegador.
- Las reglas del repositorio niegan a las clientas editar puntos o asignarse el rol de jefa. Los registros de servicio son inmutables, los canjes aprobados descuentan saldo mediante transacción atómica y las anulaciones se respaldan con documentos `voids` inmutables y únicos por visita.
- No se puede verificar realmente que una atención ocurrió sin un operador confiable; la cuenta administradora debe protegerse con MFA.
- No incluir claves privadas, contraseñas, secretos de Facebook, ni archivos de cuentas de servicio en GitHub. La configuración pública de la app web de Firebase ya está definida en el HTML.

## Animaciones e interacción pendientes

### MVP web en computadora y celular

- [ ] Mostrar el saldo y la recompensa más cercana al entrar. En la primera visita, la monita saluda con un salto breve. Si el saldo es cero, mostrar «Tu próximo servicio te suma monedas».
- [ ] Hacer que las tarjetas respondan al toque o clic. Mostrar qué incluye el premio y cuántas monedas faltan, o el botón **Canjear** si hay saldo suficiente.
- [ ] Al confirmar los puntos de un servicio, mostrar `+X monedas`, animar unas monedas hacia el saldo y subir el contador hasta el total confirmado.
- [ ] Llenar la barra en sincronía con el contador y mostrar chispas breves en la punta. Limitar la barra al 100 % y mostrar el saldo completo en el contador.
- [ ] Al alcanzar un premio, abrir el candado, dar un destello a **Canjear** y hacer saltar a la monita junto a «¡Desbloqueaste una recompensa!».
- [ ] Mostrar «Solicitud enviada» al pedir un canje. Cuando la jefa lo apruebe, mostrar un check con «¡Canje realizado!», actualizar el saldo y recalcular el progreso.
- [ ] Probar en computadora y celular con los controles temporales **Sumar 10** y **Sumar 25**, partiendo de 80 monedas y un premio de 100 en la demo. Si se acreditan monedas con la app cerrada, reproducir la secuencia una vez al volver. Respetar la preferencia de movimiento reducido.

### Después del MVP

- [ ] Añadir un guiño de la monita al desbloquear el primer premio.
- [ ] Diseñar una celebración especial para el primer canje.
- [ ] Añadir una transición que amplíe la foto del premio al abrir su detalle.
- [ ] Reproducir estas interacciones en la app nativa cuando se desarrolle.

## Próximo proyecto — App de asistencia a la movilidad para personas ciegas

**Estado:** idea registrada; siguiente aplicación después de Club Monas, no forma parte del MVP actual.

- Objetivo: ayudar a personas ciegas o con baja visión a desplazarse con mayor autonomía, detectando el entorno y proporcionando orientación sobre el camino.
- Explorar cámara y sensores del teléfono, estimación de profundidad y detección de obstáculos, desniveles, escalones y superficies de paso.
- Comunicar advertencias y orientaciones por audio y vibración, con una interfaz accesible y baja latencia.
- Primer paso: investigar viabilidad y diseñar un prototipo en entornos controlados, con participación de personas ciegas y especialistas en orientación y movilidad.
- Seguridad: no afirmar que una ruta o pisada es segura cuando no se puede comprobar. La aplicación debe expresar incertidumbre y funcionar como apoyo complementario al bastón, perro guía y otras ayudas; no sustituirlos. Validar rigurosamente antes de cualquier uso en la vía pública.

