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
- **Anulación de atención (nueva, pendiente de despliegue de reglas):** la jefa puede corregir una acreditación por error, con motivo obligatorio, descuento atómico de puntos y una visita, sin borrar la visita original. Se guarda un documento inmutable `voids/void-{visitId}` con responsable y motivo. No permite anular dos veces ni dejar saldo negativo. En la demo puede probarse inmediatamente; con Firebase real el panel de anulación está disponible únicamente en `?live=1&void=1` **DESPUÉS de publicar las reglas nuevas**. El modo normal y `?live=1` sin `void=1` no activan la función.
- Modo DEMO por `?demo=1` para recorrer el flujo completo: entrar como clienta → solicitar premio → cambiar a jefa → aprobar → registrar servicio → volver a clienta. No se guarda ningún dato real.

**Actualización 11/11/2026:** el propietario confirmó Firestore Standard `(default)` en **southamerica-west1 (Chile)**, el propietario indicó que publicó las reglas y creó el documento `admins/{uid}` con `enabled=true`. **No se ha verificado el contenido publicado en Firebase**; además el archivo de GitHub fue reemplazado por una plantilla `allow read, write: if false` y restaurado por el asistente al contenido seguro de 7665 caracteres. **Es necesario copiar de nuevo las reglas correctas de GitHub a Firebase y publicarlas antes de probar el enlace `?live=1`.**

**Pendiente para activar la anulación:** el archivo `puntos/firestore.rules` cambió después de la publicación anterior. El usuario debe copiar su contenido completo y volver a **Publicar** en Firestore → Reglas. Hasta entonces, no abrir la prueba `?live=1&void=1`, porque Firebase rechazará las nuevas operaciones de anulación. Después de publicar, validar con dos cuentas y confirmar que `voids` se puede leer y escribir correctamente. El asistente ha verificado la sintaxis JavaScript y la simulación, pero NO ha podido ejecutar el emulador ni comprobar las nuevas reglas contra Firestore real.

**La consulta de saldo y visitas funciona con Firestore en tiempo real también en** `https://manosmonas.github.io/web/puntos/`. **Las clientas pueden solicitar canjes desde la URL habitual**, con una confirmación previa. La solicitud se guarda como `pending` sin descontar puntos y aparece en su perfil. La jefa continúa aprobando/rechazando solamente mediante `?live=1` mientras se valida el ciclo completo; `?demo=1` sigue siendo simulación. El perfil se vincula al UID de la sesión Firebase y deja de mostrar cero mientras espera una lectura real. La jefa debe usar `?live=1` para registrar atenciones. No lanzar canjes públicos ni dar por auditadas las reglas hasta terminar las pruebas. Las reglas del archivo GitHub **no se publican automáticamente** en Firebase.

## Activación final de Firebase (completada parcialmente; verificar en orden)
1. En el proyecto **manos-monas-puntos**, crear **Cloud Firestore** en modo producción. La aplicación Firebase Web ya está registrada.
2. En Firestore → **Rules**, pegar y **publicar** el contenido completo de `puntos/firestore.rules` desde GitHub. No habilitar reglas de prueba que permitan acceso público. Las reglas verifican roles y validan cada cambio de puntos contra la creación de una visita o la aprobación de un canje, mediante `getAfter()`.
3. Entrar al Club Monas con la cuenta Google/Facebook de la **jefa** para obtener su UID desde Firebase → Authentication → Users. En Firestore crear la colección `admins`, documento con ID **exactamente igual a su UID**, campo `enabled` tipo **boolean** con valor `true`. Debe existir **únicamente** para cuentas autorizadas; la jefa puede crear su perfil al iniciar sesión tras activar la base de datos.
4. **Lectura real activada:** `window.MANOS_MONAS_ENABLE_DATA = true`, para que las clientas vean sus puntos y visitas desde su perfil con actualizaciones en tiempo real. `window.MANOS_MONAS_ENABLE_WRITES = ...get('live') === '1'` mantiene la acreditación y **aprobación de canjes** restringidas a la URL de prueba mientras se validan reglas y catálogo. La **solicitud de canje por una clienta** está habilitada en la URL normal y requiere sesión autenticada, saldo suficiente y confirmación.
5. Probar con **dos cuentas distintas**: (a) clienta, que no puede acreditar puntos, (b) jefa, que sí. La jefa registra una manicura y suma 30 puntos; clienta ve historial; con saldo suficiente solicita premio; jefa lo aprueba y se descuentan puntos. Verificar que una solicitud solo se procese una vez y que no se puedan gastar puntos negativos.
6. Realizar pruebas de seguridad con el emulador de Firebase y revisar las reglas antes de abrir a todas las clientas. **La lógica está escrita, pero las reglas aún no han sido probadas contra Firestore real por el asistente**.
7. Definir/confirmar importes y premios ANTES de habilitar el programa real. Los valores actuales son meramente de prueba. Los valores en las reglas y en la web deben mantenerse idénticos.
8. Configurar alertas de uso/costos de Firebase y probar errores de conexión y cierre de sesión.

**Canjes: actualización 11/11/2026.** La clienta pulsa «Solicitar canje», confirma, Firestore crea `redemptions/{id}` con `status=pending` y la interfaz marca «Solicitud pendiente». El saldo se conserva hasta que la jefa apruebe. Se comprobó con un simulador de autenticación y Firestore (250 puntos → solicitud de manicura 200 → pendiente, manteniendo 250); **falta verificar la operación contra Firebase real y el ciclo de aprobación/rechazo**. El rechazo no descuenta puntos. Los pendientes duplicados del mismo premio se evitan en la interfaz, pero falta una restricción atómica interdispositivos; las aprobaciones siguen protegidas por comprobación de saldo en una transacción.

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
