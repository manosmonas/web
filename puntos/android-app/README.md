# Manos Monas Club para Android

Proyecto Expo y React Native con pantallas Android de acceso, saldo, próximas reservas y perfil. Las lecturas usan el mismo proyecto Firebase que la web.

## Validar el código

```sh
npm ci
npm run bundle:verify
```

La exportación comprueba el bundle de JavaScript. La compilación para instalar requiere Android SDK, JDK, firma y registrar `pe.manosmonas.club.android` en `manos-monas-puntos`. Colocar el `google-services.json` de esa app en este directorio, registrar el SHA-1 de la firma y configurar `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` con el ID de cliente web de Google del proyecto. El APK piloto que abre la web usa otro identificador de paquete.

La primera base aún requiere conectar Facebook, las notificaciones nativas y los flujos de recompensas, canjes y administración antes de reemplazar la web en Android.
