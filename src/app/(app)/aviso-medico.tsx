import { H, P, TextPage } from "@/ui/TextPage";

export default function AvisoMedico() {
  return (
    <TextPage title="Aviso médico">
      <P>MediPlan es una herramienta de organización y recordatorio. No da diagnósticos, no receta ni reemplaza la indicación de tu médico o farmacéutico.</P>
      <H>Seguí siempre la indicación médica</H>
      <P>Cargá tus medicamentos, dosis y horarios tal como te los indicó tu profesional de la salud. Ante cualquier duda sobre un medicamento, consultá con tu médico o farmacéutico antes de modificar o suspender un tratamiento.</P>
      <H>Los recordatorios pueden fallar</H>
      <P>Las alarmas dependen del celular: batería, ahorro de energía, permisos, volumen y conexión. No dependas únicamente de la app para tomar medicamentos críticos. Revisá en Perfil, Configurar notificaciones que todo esté en orden.</P>
      <H>En una emergencia</H>
      <P>Si tenés síntomas graves o creés que tomaste una dosis equivocada, llamá a los servicios de emergencia de tu zona.</P>
    </TextPage>
  );
}
