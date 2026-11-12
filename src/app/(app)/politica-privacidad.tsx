import { H, P, TextPage } from "@/ui/TextPage";

/** BORRADOR para revisar antes de publicar en Google Play (debe coincidir con la política publicada en la web). */
export default function PoliticaPrivacidad() {
  return (
    <TextPage title="Política de privacidad">
      <P>MediPlan es un proyecto académico que ayuda a organizar tratamientos con medicamentos. Esta política explica qué datos usamos y para qué.</P>
      <H>Qué datos guardamos</H>
      <P>Tu correo electrónico y tu nombre; los planes de tratamiento que cargás (medicamentos, dosis, horarios y stock); el registro de tus tomas; y las invitaciones a cuidadores. Si activás los avisos a cuidadores, guardamos el identificador de tu dispositivo para enviarlos.</P>
      <H>Para qué los usamos</H>
      <P>Solo para mostrarte tus recordatorios, llevar el historial y el stock, y avisar a las personas que vos invitaste a supervisar tu plan cuando una toma queda sin registrar o el stock es bajo. No usamos tus datos para publicidad ni los vendemos.</P>
      <H>Quién puede verlos</H>
      <P>Vos y las personas que invitaste y aceptaron supervisar un plan. Nadie más.</P>
      <H>Dónde se guardan</H>
      <P>El acceso con correo y contraseña lo gestiona Firebase Authentication (Google). Los demás datos se guardan en una base de datos PostgreSQL. Las alarmas de cada toma se programan en tu propio celular.</P>
      <H>Tus derechos</H>
      <P>Podés eliminar tu cuenta y todos tus datos desde Perfil, Privacidad y seguridad, Eliminar mi cuenta. Se borran de inmediato y no se pueden recuperar.</P>
      <H>Contacto</H>
      <P>Para consultas sobre tus datos escribinos desde el formulario de contacto del sitio web de MediPlan.</P>
    </TextPage>
  );
}
