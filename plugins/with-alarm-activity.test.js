const { applyAlarmActivity } = require("./with-alarm-activity");

const manifest = () => ({
  manifest: {
    application: [
      {
        activity: [
          { $: { "android:name": ".MainActivity", "android:exported": "true" } },
          { $: { "android:name": "com.otra.Actividad" } },
        ],
      },
    ],
  },
});

describe("applyAlarmActivity", () => {
  it("dado el manifiesto de la app, cuando se aplica, entonces la actividad principal puede abrirse sobre la pantalla bloqueada y encenderla", () => {
    const m = applyAlarmActivity(manifest());
    const main = m.manifest.application[0].activity[0].$;
    expect(main["android:showWhenLocked"]).toBe("true");
    expect(main["android:turnScreenOn"]).toBe("true");
    expect(main["android:exported"]).toBe("true");
  });

  it("dado el manifiesto de la app, cuando se aplica, entonces no toca las demás actividades", () => {
    const m = applyAlarmActivity(manifest());
    expect(m.manifest.application[0].activity[1].$).toEqual({ "android:name": "com.otra.Actividad" });
  });

  it("dado un manifiesto ya modificado, cuando se aplica de nuevo, entonces queda igual (idempotente)", () => {
    const once = applyAlarmActivity(manifest());
    expect(applyAlarmActivity(JSON.parse(JSON.stringify(once)))).toEqual(once);
  });

  it("dado un manifiesto sin actividad principal, cuando se aplica, entonces falla con un mensaje claro en vez de seguir en silencio", () => {
    const sin = { manifest: { application: [{ activity: [{ $: { "android:name": "com.otra.Actividad" } }] }] } };
    expect(() => applyAlarmActivity(sin)).toThrow(/MainActivity/);
  });
});
