import { alarmWarning } from "./permissions";

describe("alarmWarning", () => {
  it("dado todo concedido, entonces no hay aviso", () => expect(alarmWarning({ notifications: true, exactAlarms: true })).toBeNull());
  it("dado que las notificaciones están apagadas, entonces avisa que no sonará ningún recordatorio", () =>
    expect(alarmWarning({ notifications: false, exactAlarms: true })).toMatch(/no vas a recibir/i));
  it("dado que faltan las alarmas exactas, entonces avisa que pueden demorarse", () =>
    expect(alarmWarning({ notifications: true, exactAlarms: false })).toMatch(/demorar/i));
  it("dado que no aplica (iOS, exactAlarms null), entonces no avisa por eso", () =>
    expect(alarmWarning({ notifications: true, exactAlarms: null })).toBeNull());
});
