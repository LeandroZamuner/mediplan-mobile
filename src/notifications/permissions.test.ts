import { AndroidNotificationSetting } from "react-native-notify-kit";
import { alarmWarning, fullScreenFrom } from "./permissions";

describe("alarmWarning", () => {
  it("dado todo concedido, entonces no hay aviso", () => expect(alarmWarning({ notifications: true, exactAlarms: true })).toBeNull());
  it("dado que las notificaciones están apagadas, entonces avisa que no sonará ningún recordatorio", () =>
    expect(alarmWarning({ notifications: false, exactAlarms: true })).toMatch(/no vas a recibir/i));
  it("dado que faltan las alarmas exactas, entonces avisa que pueden demorarse", () =>
    expect(alarmWarning({ notifications: true, exactAlarms: false })).toMatch(/demorar/i));
  it("dado que no aplica (iOS, exactAlarms null), entonces no avisa por eso", () =>
    expect(alarmWarning({ notifications: true, exactAlarms: null })).toBeNull());
});

describe("alarmWarning con la alarma Fuerte", () => {
  const ok = { notifications: true, exactAlarms: true };
  it("dado el nivel Fuerte y la pantalla completa apagada, entonces avisa cómo activarla para que se abra sobre el bloqueo", () =>
    expect(alarmWarning({ ...ok, fullScreen: false }, "fuerte")).toMatch(/pantalla completa/i));
  it("dado el nivel Normal y la pantalla completa apagada, entonces no avisa (no la usa)", () => expect(alarmWarning({ ...ok, fullScreen: false }, "normal")).toBeNull());
  it("dado el nivel Fuerte con la pantalla completa permitida o que no aplica, entonces no avisa", () => {
    expect(alarmWarning({ ...ok, fullScreen: true }, "fuerte")).toBeNull();
    expect(alarmWarning({ ...ok, fullScreen: null }, "fuerte")).toBeNull();
  });
  it("dados varios permisos faltantes, entonces avisa primero de las notificaciones y de las alarmas exactas", () => {
    expect(alarmWarning({ notifications: false, exactAlarms: false, fullScreen: false }, "fuerte")).toMatch(/no vas a recibir/i);
    expect(alarmWarning({ notifications: true, exactAlarms: false, fullScreen: false }, "fuerte")).toMatch(/demorar/i);
  });
});

describe("fullScreenFrom", () => {
  it("traduce el ajuste de Android: permitido, apagado o no aplica (Android anterior al 14)", () => {
    expect(fullScreenFrom(AndroidNotificationSetting.ENABLED)).toBe(true);
    expect(fullScreenFrom(AndroidNotificationSetting.DISABLED)).toBe(false);
    expect(fullScreenFrom(AndroidNotificationSetting.NOT_SUPPORTED)).toBeNull();
    expect(fullScreenFrom(undefined)).toBeNull();
  });
});
