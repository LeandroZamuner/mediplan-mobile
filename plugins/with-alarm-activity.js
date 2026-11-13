const { withAndroidManifest } = require("expo/config-plugins");

/**
 * La alarma Fuerte se abre en pantalla completa sobre el bloqueo: la actividad principal tiene que poder mostrarse con el
 * celular bloqueado y encender la pantalla (Android no lo permite si no se declara en el manifiesto).
 */
function applyAlarmActivity(androidManifest) {
  const activities = androidManifest.manifest.application?.[0]?.activity ?? [];
  const main = activities.find((a) => a.$["android:name"] === ".MainActivity");
  if (!main) throw new Error("with-alarm-activity: no se encontró .MainActivity en el AndroidManifest");
  main.$["android:showWhenLocked"] = "true";
  main.$["android:turnScreenOn"] = "true";
  return androidManifest;
}

const withAlarmActivity = (config) => withAndroidManifest(config, (c) => {
  c.modResults = applyAlarmActivity(c.modResults);
  return c;
});

module.exports = withAlarmActivity;
module.exports.applyAlarmActivity = applyAlarmActivity;
