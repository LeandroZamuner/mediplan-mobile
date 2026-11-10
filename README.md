# mediplan-mobile

App móvil de MediPlan (Android) — **todavía no empezada**. Va a ser React Native con Expo y va a consumir la misma API
que la web (`mediplan-api`), con el mismo login de Firebase.

Lo que le toca a la app, según los requerimientos:

- Recordatorios de cada toma como **notificaciones locales** (funcionan sin internet) y registro de la toma desde la
  notificación ("Tomé" / "Posponer").
- Avisos push (Firebase Cloud Messaging) a cuidadores cuando una toma queda sin registrar o el stock es bajo.
- Reprogramar las alarmas cuando el plan cambia (llega un push silencioso `plan_sync`).
- Publicación en Google Play.

Repos relacionados: [`mediplan-api`](../mediplan-api) y [`mediplan-web`](../mediplan-web).

## Licencia

[MIT](LICENSE): podés usar, copiar y modificar el código manteniendo el aviso de autor, sin garantía.
