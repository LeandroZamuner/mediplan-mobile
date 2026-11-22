/** Formas de las respuestas de la API de MediPlan (mediplan-api). */

export type Me = { id: string; email: string; role: "patient" | "caregiver"; emailVerified: boolean; timezone: string };

export type Schedule = { dayOfWeek: number; timeOfDay: string }; // 0 = domingo ... 6 = sábado, "HH:MM"

export type Medication = {
  id: string;
  name: string;
  dose: string;
  startDate: string; // AAAA-MM-DD
  endDate?: string;
  schedules: Schedule[];
  stockUnits: number;
  stockAlertAt: number;
};

export type Plan = {
  id: string;
  patientId: string;
  name: string;
  status: "active" | "completed" | "cancelled";
  createdAt: string;
  medications: Medication[];
};

export type DoseStatus = "pending" | "taken" | "missed";

export type Occurrence = {
  medicationId: string;
  medicationName: string;
  scheduledAt: string;
  takenAt?: string;
  status: DoseStatus;
};

export type Stats = { expected: number; taken: number; missed: number; pending: number; adherenceRate: number | null };

export type AppNotification = {
  id: string;
  kind: "missed_dose" | "low_stock" | string;
  title: string;
  body: string;
  data: Record<string, string>;
  readAt: string | null;
  createdAt: string;
};

export type CaregiverLink = {
  id: string;
  planId: string;
  email: string;
  caregiverId?: string;
  status: "pending" | "accepted" | "rejected";
  expiresAt: string;
  token?: string; // solo al crear la invitación
  planName?: string; // solo en las invitaciones pendientes que recibís
  patientEmail?: string; // quién te invita
};

/** Estado de la suscripción (GET /me/subscription). Un tope en null significa "sin límite". */
export type Subscription = {
  tier: "free" | "premium";
  cancelled: boolean; // Premium que ya no se renueva
  pending: boolean; // empezó a pagar y el pago todavía no se confirmó
  currentPeriodEnd: string | null;
  limits: { maxActivePlans: number | null; maxMedications: number | null; maxCaregiversPerPlan: number | null };
  usage: { activePlans: number; medications: number };
  payments: { enabled: boolean; priceArs?: number; currency?: string; period?: string };
};
