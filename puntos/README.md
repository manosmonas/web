# Club de Recompensas · Manos Monas
MVP React 18 para navegador móvil y escritorio. Disponible en `https://manosmonas.github.io/web/puntos/`. La web comercial del directorio raíz no se modifica.

## Estado (10/11/2026)
- Firebase Web conectado a `manos-monas-puntos` para autenticación con Google (público en GitHub Pages); pendiente autorizar y probar `manosmonas.github.io` en Firebase Authentication.
- Los datos de puntos, canjes y roles están **desactivados** deliberadamente (`window.MANOS_MONAS_ENABLE_DATA = false`) hasta provisionar Firestore y publicar reglas seguras. El login real puede funcionar sin crear puntos.
- Facebook permanece desactivado en la interfaz real hasta completar el proveedor OAuth en Meta y Firebase.
- La rama `gh-pages` conserva la web principal en raíz; los cambios se limitan a `puntos/`.
- Si se borra Firebase config, se activa la demo sin guardar datos.
- Por ahora no hay login por SMS, contraseña, ni recuperación de contraseña propia.
- Firestore: perfiles de clienta, registros de servicios, puntos, solicitudes de canje y aprobación/rechazo por la jefa.
- Roles: document `admins/{UID}` (crear manualmente en la consola, NO desde la app).
- Reservas: placeholder; aún sin sistema de citas.
- Puntos y recompensas son valores de ejemplo; aprobar tarifas antes de utilizarlo en producción.
- Web adaptativa, no es todavía una app nativa Android/iOS. Para móvil nativo se preparará proyecto React Native/Expo por separado, compartiendo modelo y lógica.

## Configuración Firebase final
1. Crear proyecto Firebase y agregar una aplicación **Web**.
2. Authentication > Sign-in method > habilitar Google y Facebook. Para Facebook, crear una aplicación en Meta for Developers, configurar App ID/App Secret en Firebase y registrar el URI de redirección OAuth indicado por Firebase en Meta. En Authorized domains agregar `manosmonas.github.io` y, tras comprarlo, `manosmonas.com`.
3. Firestore Database > crear base de datos. Elegir región cercana al negocio y modo producción.
4. Firestore > Rules > copiar y publicar `puntos/firestore.rules` (no dejar reglas de prueba).
5. Crear una cuenta Google para la jefa e iniciar sesión en la aplicación una vez. En Authentication > Users copiar su UID. En Firestore > crear colección `admins`, documento con ID igual al UID y campo `enabled` boolean `true`. No crear documentos de admin para clientas.
6. El objeto `window.MANOS_MONAS_FIREBASE` ya contiene la configuración pública de Firebase Web suministrada por el propietario. **No pegar claves privadas ni service accounts**. Tras crear Firestore, publicar reglas y realizar auditoría mínima, activar explícitamente `window.MANOS_MONAS_ENABLE_DATA = true` solo cuando estén seguros los accesos y canjes.
7. Verificar desde navegador: Google login como clienta, vista de jefa, registrar atención, comprobar puntos, solicitar premio, aprobar y descontar.
8. Activar alertas de presupuesto / uso en Google Cloud y Firebase. Revisar cuotas del plan gratuito.
9. Antes de producción real: mover adjudicación de puntos y canjes a backend confiable (Cloud Functions) o reforzar Rules con validación cruzada `getAfter()`, límites de importe y auditoría. Las reglas de este prototipo impiden escrituras de clientas sobre su saldo pero una cuenta de jefa comprometida puede conceder puntos arbitrarios. **No usar como sistema antifraude de producción sin ese refuerzo**.
10. Una vez finalizado el desarrollo, migrar a `manosmonas.com` y actualizar los dominios autorizados en Auth.

## Notas
- React y Firebase se cargan desde CDN para publicar la maqueta directamente en GitHub Pages sin configurar una cadena de build.
- Para producción recomendamos migrar el código a módulos TypeScript + Vite/Expo y pruebas automáticas.
- Políticas de puntos actuales de ejemplo: manicura +30, pedicura +40, pestañas +50, mechas +90, alisado +110. Premios: manicura 200, pedicura 400, lifting 650, descuento alisado 1000.
