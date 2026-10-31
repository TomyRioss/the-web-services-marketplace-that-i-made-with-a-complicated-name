import type { Metadata } from "next";
import { LegalDocument, type LegalSection } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Términos y condiciones | Devta",
  description: "Condiciones generales de uso de Devta y su marketplace de servicios digitales.",
};

const sections: LegalSection[] = [
  {
    heading: "1. Sobre estos términos",
    paragraphs: [
      "Estos términos regulan el acceso y uso de Devta, el marketplace de TTM Co-Build para descubrir y solicitar servicios de programación web. Al crear una cuenta o usar el sitio, aceptas estas condiciones y la Política de privacidad.",
      "Si no estás de acuerdo, no uses la cuenta ni solicites servicios. Las condiciones particulares que se informen para un servicio u orden complementan estos términos; si hay una diferencia, prevalecen los derechos obligatorios que reconozca la ley aplicable.",
    ],
  },
  {
    heading: "2. Cuenta y acceso",
    bullets: [
      "Debes proporcionar información correcta y mantener actualizado tu correo electrónico y los demás datos que solicitemos.",
      "Eres responsable de proteger tus credenciales y de la actividad realizada desde tu cuenta. Avísanos si detectas un acceso que no reconoces.",
      "El acceso con Google usa la autenticación de ese proveedor. Google comparte los datos básicos de perfil necesarios para identificar tu cuenta; el uso de Google también está sujeto a sus propias condiciones.",
    ],
  },
  {
    heading: "3. Servicios y solicitudes",
    paragraphs: [
      "Cada publicación describe el alcance, precio y plazo informado para el servicio. Revisa esos datos y cualquier condición adicional antes de solicitarlo. Una solicitud queda sujeta a la confirmación y coordinación indicadas en la plataforma.",
      "Los cambios de alcance, entregas, revisiones y fechas deben acordarse por los canales asociados al servicio. Las condiciones específicas aceptadas para una orden rigen esa prestación, sin limitar derechos irrenunciables de consumidores y usuarios.",
    ],
  },
  {
    heading: "4. Uso permitido",
    paragraphs: ["Usa Devta de forma lícita y respetuosa. No puedes:"],
    bullets: [
      "Suplantar a otra persona, falsear información o acceder a cuentas ajenas.",
      "Publicar contenido ilegal, engañoso, discriminatorio o que infrinja derechos de terceros.",
      "Interferir con la seguridad o disponibilidad del sitio, extraer datos de forma automatizada sin autorización o intentar eludir sus controles.",
      "Usar el marketplace para actividades distintas de las que ofrece la plataforma.",
    ],
  },
  {
    heading: "5. Contenido y propiedad intelectual",
    paragraphs: [
      "El software, nombre, marca, diseño y contenido de Devta pertenecen a sus titulares o se usan con autorización. No los copies, modifiques ni distribuyas fuera de los usos permitidos por la ley o autorizados por escrito.",
      "Conservas los derechos sobre el material que aportas. Al publicarlo o enviarlo para gestionar un servicio, autorizas su uso en la medida necesaria para mostrarlo, procesar la solicitud y prestar soporte. Los derechos sobre los entregables de un servicio se rigen por las condiciones acordadas para esa orden.",
    ],
  },
  {
    heading: "6. Disponibilidad y responsabilidad",
    paragraphs: [
      "Trabajamos para mantener la plataforma disponible y segura, pero pueden ocurrir interrupciones, mantenimiento o errores. Podemos actualizar funciones y contenidos para operar y mejorar el servicio.",
      "En la medida permitida por la ley, Devta no responde por daños causados por el uso indebido de la cuenta, interrupciones fuera de su control o contenido aportado por terceros. Esta sección no excluye garantías ni responsabilidades que la ley no permita excluir.",
    ],
  },
  {
    heading: "7. Restricción o cierre de cuenta",
    paragraphs: [
      "Puedes dejar de usar Devta y solicitar el cierre de tu cuenta. Podemos limitar temporalmente el acceso cuando sea necesario para proteger la plataforma, a sus usuarios o cumplir una obligación legal. Cuando corresponda, informaremos el motivo y los pasos disponibles para resolverlo.",
    ],
  },
  {
    heading: "8. Cambios a estos términos",
    paragraphs: [
      "Podemos actualizar estas condiciones para reflejar cambios del servicio o de la normativa. Publicaremos la versión vigente en esta página con su fecha de actualización. Si un cambio requiere tu aceptación por ley, te la solicitaremos antes de aplicarlo.",
    ],
  },
  {
    heading: "9. Ley aplicable y derechos del consumidor",
    paragraphs: [
      "Estos términos se interpretan conforme a las leyes de la República Argentina, sin afectar las normas imperativas que protejan a consumidores y usuarios ni el acceso a las autoridades competentes que corresponda.",
    ],
    references: [
      { label: "Ley 24.240 de Defensa del Consumidor", href: "https://www.argentina.gob.ar/normativa/nacional/638/actualizacion" },
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      title="Términos y condiciones"
      description="Estas condiciones explican las reglas para usar Devta y solicitar servicios a través del marketplace."
      sections={sections}
    />
  );
}
