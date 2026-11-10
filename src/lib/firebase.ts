import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
// @ts-expect-error getReactNativePersistence solo existe en el build de React Native de firebase/auth
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from "firebase/auth";

/** Autenticación de Firebase con la sesión guardada en el celular. La config es pública (la seguridad está en las reglas de Firebase). */
export function firebaseAuth(): Auth {
  if (getApps().length) return getAuth(getApp());
  const app = initializeApp({
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  });
  const auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  auth.languageCode = "es";
  return auth;
}
