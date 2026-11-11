import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged, signOut as fbSignOut, type User } from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, api } from "@/lib/api";
import { firebaseAuth } from "@/lib/firebase";
import type { CaregiverLink, Me, Plan } from "@/lib/types";
import { needsOnboarding } from "./onboarding";

/** loading · signedOut · needsVerification (correo sin verificar) · ready (`me` disponible) · error */
export type AuthStatus = "loading" | "signedOut" | "needsVerification" | "ready" | "error";

type Value = {
  status: AuthStatus;
  firebaseUser: User | null;
  me: Me | null;
  error: string | null;
  /** null = todavía leyendo del celular. */
  onboarded: boolean | null;
  completeOnboarding: () => Promise<void>;
  recheck: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<Value | null>(null);

/** Preferencia elegida al crear la cuenta: solo decide la pantalla de inicio, no da permisos. */
export const ROLE_KEY = "mediplan.role";
const onboardedKey = (uid: string) => `mediplan.onboarded.${uid}`;

async function savedRole(): Promise<"patient" | "caregiver"> {
  try {
    return (await AsyncStorage.getItem(ROLE_KEY)) === "caregiver" ? "caregiver" : "patient";
  } catch {
    return "patient";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  const completeOnboarding = useCallback(async () => {
    setOnboarded(true);
    const uid = firebaseAuth().currentUser?.uid;
    if (uid) await AsyncStorage.setItem(onboardedKey(uid), "1").catch(() => {});
  }, []);

  const load = useCallback(async (user: User | null) => {
    setFirebaseUser(user);
    if (!user) {
      setOnboarded(false);
      setMe(null);
      setStatus("signedOut");
      return;
    }
    try {
      if (!user.emailVerified) await user.reload();
      if (!user.emailVerified) {
        setMe(null);
        setStatus("needsVerification");
        return;
      }
      await user.getIdToken(true);
      let profile: Me;
      try {
        profile = await api<Me>("/me");
      } catch (e) {
        if (e instanceof ApiError && e.status === 403 && /sin registrar/i.test(e.message)) {
          profile = await api<Me>("/auth/register", { method: "POST", json: { role: await savedRole() } });
        } else throw e;
      }
      const done = (await AsyncStorage.getItem(onboardedKey(user.uid)).catch(() => null)) === "1";
      const [plans, supervised, invitations] = await Promise.all([
        api<Plan[]>("/plans").catch(() => [] as Plan[]),
        api<Plan[]>("/plans/supervised").catch(() => [] as Plan[]),
        api<CaregiverLink[]>("/invitations").catch(() => [] as CaregiverLink[]),
      ]);
      setOnboarded(!needsOnboarding(done, { planCount: plans.length, supervisedCount: supervised.length, invitationCount: invitations.length }));
      setMe(profile);
      setError(null);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos conectar con MediPlan");
      setStatus("error");
    }
  }, []);

  useEffect(() => onAuthStateChanged(firebaseAuth(), (u) => void load(u)), [load]);

  const recheck = useCallback(() => load(firebaseAuth().currentUser), [load]);
  const signOut = useCallback(() => fbSignOut(firebaseAuth()), []);
  const value = useMemo(
    () => ({ status, firebaseUser, me, error, onboarded, completeOnboarding, recheck, signOut }),
    [status, firebaseUser, me, error, onboarded, completeOnboarding, recheck, signOut],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return v;
}
