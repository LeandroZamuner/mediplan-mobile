# mediplan-mobile

App móvil de MediPlan (Android), en desarrollo. React Native con Expo (Expo Router, TypeScript); consume la misma API
que la web (`mediplan-api`), con el mismo login de Firebase.

Lo que le toca a la app, según los requerimientos:

- Recordatorios de cada toma como **notificaciones locales** (funcionan sin internet) y registro de la toma desde la
  notificación ("Tomé" / "Posponer").
- Avisos push (Firebase Cloud Messaging) a cuidadores cuando una toma queda sin registrar o el stock es bajo.
- Reprogramar las alarmas cuando el plan cambia (llega un push silencioso `plan_sync`).
- Publicación en Google Play.

Repos relacionados: [`mediplan-api`](../mediplan-api) y [`mediplan-web`](../mediplan-web).

## Alarmas

- Las tomas suenan como **notificaciones locales** (sin internet). Dos niveles a elegir en Perfil → Configurar notificaciones:
  **Normal** (notificación común) y **Fuerte** (canal de alarma: suena por el volumen de alarma, vibra fuerte, se ve en la pantalla
  bloqueada y no se descarta deslizando).
- Si no se marca "Tomé", la alarma **se repite cada 5 minutos hasta 30 minutos**; al registrar la toma (en la app, desde la
  notificación o desde otro dispositivo) se cancelan las repeticiones. A los 30 minutos la API avisa a los cuidadores.
- Hay un tope de 200 alarmas programadas (Android limita a 500 por app).
- Se prueba solo en la *development build*: Expo Go no crea los canales de notificación.

## Estado

- Hecho: base del proyecto, login con Firebase (pantalla provisoria), cliente de la API, y la lógica de **alarmas locales**
  (`src/notifications`: qué tomas programar y sincronización de las próximas 7 días), con tests.
- Pendiente: pantallas según el diseño de Figma, "Tomé"/"Posponer" desde la notificación, push FCM para cuidadores.

## Desarrollo

```bash
npm install --legacy-peer-deps
cp .env.example .env   # completar EXPO_PUBLIC_FIREBASE_API_KEY (pública)
npm test && npm run typecheck && npm run lint
npx expo start
```

## Probar con el emulador local de Firebase Auth (sin correos reales)

Sirve para probar cuentas, cuidadores e invitaciones sin depender de casillas de correo:

```bash
npx firebase-tools emulators:start --only auth --project mediplan-4f001      # Auth en :9099
# API aparte, con base propia y el emulador:
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 FIREBASE_PROJECT_ID=mediplan-4f001 PORT=8090 \
  DATABASE_URL=postgres://mediplan:mediplan@localhost:5432/mediplan_emu?sslmode=disable JOB_SECRET=dev-local-secret go run ./cmd/api
# App:
EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR=http://10.0.2.2:9099 EXPO_PUBLIC_API_URL=http://10.0.2.2:8090 npx expo start
```

En el emulador las cuentas no mandan correo: se verifican con `POST /identitytoolkit.googleapis.com/v1/projects/<id>/accounts:update`
(`Authorization: Bearer owner`, `{"localId": "...", "emailVerified": true}`).

## Versión instalable (development build)

Expo Go no soporta bien las notificaciones en Android, así que para probar las alarmas se usa una *development build*
(un APK propio). Se genera en la nube con EAS (plan gratuito):

```bash
npx eas-cli login                                       # tu cuenta de expo.dev
npx eas-cli build --profile development --platform android
```

Al terminar, EAS da un enlace/QR para instalar el APK en el celular. Después:

```bash
EXPO_PUBLIC_API_URL=http://<IP-de-tu-compu>:8080 npx expo start --dev-client   # celular y compu en la misma red wifi
```

El paquete de Android es `com.leandrozamuner.mediplan` (se puede cambiar hasta la primera publicación en Google Play).

## Licencia

[MIT](LICENSE): podés usar, copiar y modificar el código manteniendo el aviso de autor, sin garantía.
