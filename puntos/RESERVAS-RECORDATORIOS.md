# Recordatorios de reservas — MVP

Los avisos salen a las **8:00 a. m. del día de la cita** y **dos horas antes**, según la hora de Lima. Se envían a la cuenta titular de una cita confirmada. Los avisos de horarios anteriores quedan ocultos en la app si se cancela o cambia la cita. El registro deduplica por cita, fecha y tipo de aviso, y también por hora de inicio para el segundo aviso.

El proyecto es `manos-monas-puntos` y la región es `us-central1`. Para activarlo, el proyecto necesita el plan Blaze, Cloud Scheduler y Cloud Messaging. Desde `puntos/`, con una cuenta autorizada, desplegar las funciones y configurar la clave pública VAPID del proyecto en `MANOS_MONAS_VAPID_KEY`. El panel web habilita la suscripción cuando se configura la clave pública. Los permisos de Firestore para consultar los recordatorios ya pertenecen al perfil de su titular.

```sh
npx firebase-tools deploy --project manos-monas-puntos --only functions:registerClubPush,functions:unregisterClubPush,functions:bookingReminders
```

El registro aparece en Reservas aunque el dispositivo carezca de permiso para recibir push. En iOS, añadir la app a la pantalla de inicio y activar avisos desde ella. Validar en un dispositivo con su cuenta, una cita vigente y la app en segundo plano. El navegador y el sistema operativo gestionan el permiso y la apariencia del aviso fuera de la app.
