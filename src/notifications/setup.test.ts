import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { setupNotifications } from "./setup";

jest.mock("expo-notifications", () => ({
  AndroidImportance: { HIGH: 4, MAX: 5 },
  AndroidAudioUsage: { ALARM: 4, NOTIFICATION: 5 },
  AndroidAudioContentType: { SONIFICATION: 4 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  deleteNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  setNotificationCategoryAsync: jest.fn().mockResolvedValue(undefined),
}));

const channel = (id: string) => (Notifications.setNotificationChannelAsync as jest.Mock).mock.calls.find((c) => c[0] === id)?.[1];

describe("setupNotifications (Android)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.replaceProperty(Platform, "OS", "android");
  });
  afterEach(() => jest.restoreAllMocks());

  it("dado un celular Android, cuando arranca la app, entonces crea el canal Normal con un sonido propio de recordatorio y vibración", async () => {
    await setupNotifications();
    const c = channel("doses_v2");
    expect(c).toMatchObject({ importance: 4, sound: "recordatorio.wav" });
    expect(c.vibrationPattern.length).toBeGreaterThan(2);
  });

  it("dado un celular Android, cuando arranca la app, entonces el canal Fuerte suena como alarma (volumen de alarma, atraviesa No molestar) con el sonido largo", async () => {
    await setupNotifications();
    expect(channel("doses_strong_v2")).toMatchObject({
      importance: 5,
      sound: "alarma_fuerte.wav",
      bypassDnd: true,
      lockscreenVisibility: 1,
      audioAttributes: { usage: 4, contentType: 4 },
    });
  });

  it("dado que Android no deja cambiar un canal ya creado, cuando arranca la app, entonces borra los canales de la versión anterior", async () => {
    await setupNotifications();
    const deleted = (Notifications.deleteNotificationChannelAsync as jest.Mock).mock.calls.map((c) => c[0]);
    expect(deleted.sort()).toEqual(["doses", "doses_strong"]);
  });

  it("dada una falla al configurar los canales, cuando arranca la app, entonces no se rompe la app", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    (Notifications.setNotificationChannelAsync as jest.Mock).mockRejectedValueOnce(new Error("sin permiso"));
    await expect(setupNotifications()).resolves.toBeUndefined();
  });
});

describe("setupNotifications (iOS)", () => {
  it("dado un iPhone, cuando arranca la app, entonces no toca canales de Android", async () => {
    jest.clearAllMocks();
    jest.replaceProperty(Platform, "OS", "ios");
    await setupNotifications();
    expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });
});

describe("sonidos de las alarmas", () => {
  it("dados los canales que piden sonidos propios, cuando se arma la app, entonces el plugin los incluye en el build y los archivos existen", () => {
    const app = require("../../app.json");
    const plugin = app.expo.plugins.find((p: unknown) => Array.isArray(p) && p[0] === "expo-notifications");
    expect(plugin[1].sounds).toEqual(expect.arrayContaining(["./assets/sounds/recordatorio.wav", "./assets/sounds/alarma_fuerte.wav"]));
    expect(() => require("../../assets/sounds/recordatorio.wav")).not.toThrow();
    expect(() => require("../../assets/sounds/alarma_fuerte.wav")).not.toThrow();
  });
});
