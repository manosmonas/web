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
- Modo DEMO por `?demo=1` para recorrer el flujo completo: entrar como clienta → solicitar premio → cambiar a jefa → aprobar → registrar servicio → volver a clienta. No se guarda ningún dato real.

**Actualización 11/11/2026:** según la confirmación del propietario, Firestore Standard `(default)` fue creado en **southamerica-west1 (Chile)**, en modo producción y sin copias programadas. Falta publicar las reglas, asignar el rol de la jefa, activar el código y probar con cuentas separadas.

**El backend Firestore sigue desactivado** en `puntos/index.html` con `window.MANOS_MONAS_ENABLE_DATA = false` para evitar que las clientas usen saldos no verificados o reglas sin publicar. Haber subido `puntos/firestore.rules` a GitHub **NO las publica en Firebase**. No activar el interruptor sin completar la lista siguiente.

## Activación final de Firebase (pendiente; seguir en orden)
1. En el proyecto **manos-monas-puntos**, crear **Cloud Firestore** en modo producción. La aplicación Firebase Web ya está registrada.
2. En Firestore → **Rules**, pegar y **publicar** el contenido completo de `puntos/firestore.rules` desde GitHub. No habilitar reglas de prueba que permitan acceso público. Las reglas verifican roles y validan cada cambio de puntos contra la creación de una visita o la aprobación de un canje, mediante `getAfter()`.
3. Entrar al Club Monas con la cuenta Google/Facebook de la **jefa** para obtener su UID desde Firebase → Authentication → Users. En Firestore crear la colección `admins`, documento con ID **exactamente igual a su UID**, campo `enabled` tipo **boolean** con valor `true`. Debe existir **únicamente** para cuentas autorizadas; la jefa puede crear su perfil al iniciar sesión tras activar la base de datos.
4. Cambiar `window.MANOS_MONAS_ENABLE_DATA = true` en `puntos/index.html` **únicamente tras publicar las reglas y configurar el rol**. Esta modificación requiere publicar el archivo en GitHub Pages (lo hará el asistente cuando toque).
5. Probar con **dos cuentas distintas**: (a) clienta, que no puede acreditar puntos, (b) jefa, que sí. La jefa registra una manicura y suma 30 puntos; clienta ve historial; con saldo suficiente solicita premio; jefa lo aprueba y se descuentan puntos. Verificar que una solicitud solo se procese una vez y que no se puedan gastar puntos negativos.
6. Realizar pruebas de seguridad con el emulador de Firebase y revisar las reglas antes de abrir a todas las clientas. **La lógica está escrita, pero las reglas aún no han sido probadas contra Firestore real**.
7. Definir/confirmar importes y premios ANTES de habilitar el programa real. Los valores actuales son meramente de prueba. Los valores en las reglas y en la web deben mantenerse idénticos.
8. Configurar alertas de uso/costos de Firebase y probar errores de conexión y cierre de sesión.

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
- Las reglas del repositorio niegan a las clientas editar puntos o asignarse el rol de jefa. Los registros de servicio son inmutables y los canjes aprobados descuentan saldo mediante transacción atómica.
- No se puede verificar realmente que una atención ocurrió sin un operador confiable; la cuenta administradora debe protegerse con MFA.
- No incluir claves privadas, contraseñas, secretos de Facebook, ni archivos de cuentas de servicio en GitHub. La configuración pública de la app web de Firebase ya está definida en el HTML.
