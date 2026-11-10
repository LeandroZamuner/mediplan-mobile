import * as Notifications from "expo-notifications";
import { syncDoseAlarms } from "./sync";
import type { Plan } from "@/lib/types";

jest.mock("expo-notifications", () => ({
  SchedulableTriggerInputTypes: { DATE: "date" },
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("id"),
}));

const plans: Plan[] = [
  {
    id: "p1",
    patientId: "u1",
    name: "Plan",
    status: "active",
    createdAt: "2026-11-01T00:00:00Z",
    medications: [
      {
        id: "m1",
        name: "Ibuprofeno",
        dose: "400 mg",
        startDate: "2026-11-01",
        schedules: [{ dayOfWeek: 3, timeOfDay: "08:00" }],
        stockUnits: 5,
        stockAlertAt: 2,
      },
    ],
  },
];

describe("syncDoseAlarms", () => {
  beforeEach(() => jest.clearAllMocks());

  it("dado un plan activo, cuando se sincroniza, entonces cancela lo anterior y programa cada toma con sus datos", async () => {
    const n = await syncDoseAlarms(plans, "America/Argentina/Buenos_Aires", new Date("2026-11-10T13:00:00Z"));
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(n).toBe(1);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: "Ibuprofeno",
        body: "400 mg",
        categoryIdentifier: "dose",
        data: { planId: "p1", medicationId: "m1", scheduledAt: "2026-11-11T11:00:00.000Z" },
      },
      trigger: { type: "date", date: new Date("2026-11-11T11:00:00.000Z"), channelId: "doses" },
    });
  });

  it("dado que no hay planes, entonces solo limpia las alarmas viejas", async () => {
    expect(await syncDoseAlarms([], "America/Argentina/Buenos_Aires", new Date())).toBe(0);
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
