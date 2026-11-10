# Club de Recompensas · Manos Monas
MVP React 18 para navegador móvil y escritorio. Disponible en `https://manosmonas.github.io/web/puntos/`. La web comercial del directorio raíz no se modifica.

## Estado
- Maqueta interactiva sin backend si falta configuración: alterna entre clienta/jefa, pero **no guarda datos**.
- Acceso inicial: **Google (cuentas Gmail) y Facebook**. Ambos botones están maquetados y sus proveedores preparados en Firebase Auth; en modo demo el ingreso es simulado, no se autentica ni almacena información real.
- Por decisión del negocio, **toda la configuración de backend se deja para el final**. No habilitar accesos reales hasta completar Firebase Authentication, Firestore, reglas y pruebas.
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
6. En `puntos/index.html` reemplazar solo el objeto `window.MANOS_MONAS_FIREBASE` por `apiKey`, `authDomain`, `projectId`, `appId` y `messagingSenderId` de Firebase > Project settings > Your apps. La config web es pública por diseño; **no pegar claves privadas o service accounts**.
7. Verificar desde navegador: Google login como clienta, vista de jefa, registrar atención, comprobar puntos, solicitar premio, aprobar y descontar.
8. Activar alertas de presupuesto / uso en Google Cloud y Firebase. Revisar cuotas del plan gratuito.
9. Antes de producción real: mover adjudicación de puntos y canjes a backend confiable (Cloud Functions) o reforzar Rules con validación cruzada `getAfter()`, límites de importe y auditoría. Las reglas de este prototipo impiden escrituras de clientas sobre su saldo pero una cuenta de jefa comprometida puede conceder puntos arbitrarios. **No usar como sistema antifraude de producción sin ese refuerzo**.
10. Una vez finalizado el desarrollo, migrar a `manosmonas.com` y actualizar los dominios autorizados en Auth.

## Notas
- React y Firebase se cargan desde CDN para publicar la maqueta directamente en GitHub Pages sin configurar una cadena de build.
- Para producción recomendamos migrar el código a módulos TypeScript + Vite/Expo y pruebas automáticas.
- Políticas de puntos actuales de ejemplo: manicura +30, pedicura +40, pestañas +50, mechas +90, alisado +110. Premios: manicura 200, pedicura 400, lifting 650, descuento alisado 1000.
