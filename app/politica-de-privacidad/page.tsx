import type { Metadata } from "next";
import { LegalDocument, type LegalSection } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Política de privacidad | Devta",
  description: "Información sobre los datos personales que Devta trata y cómo ejercer tus derechos.",
};

const sections: LegalSection[] = [
  {
    heading: "1. Quién trata tus datos",
    paragraphs: [
      "Devta, el marketplace de TTM Co-Build, trata los datos personales necesarios para operar las cuentas y gestionar las solicitudes de servicios. Esta política aplica al sitio y a sus funciones de cuenta.",
    ],
  },
  {
    heading: "2. Qué datos podemos recibir",
    bullets: [
      "Datos de cuenta: correo electrónico, nombre y teléfono cuando los proporcionas.",
      "Datos de uso del servicio: solicitudes, órdenes, mensajes de soporte y la información que incluyas al usar el marketplace.",
      "Datos técnicos básicos necesarios para mantener la sesión, proteger la cuenta y diagnosticar errores.",
      "Si eliges Google para entrar, recibimos de Google tu correo verificado y los datos básicos de perfil que autorices para iniciar sesión. No recibimos tu contraseña de Google.",
    ],
  },
  {
    heading: "3. Para qué usamos la información",
    bullets: [
      "Crear y administrar tu cuenta, autenticarte y permitir el acceso al marketplace.",
      "Procesar solicitudes de servicios, mantener el historial de órdenes y facilitar comunicaciones relacionadas.",
      "Atender consultas, proteger la plataforma frente a fraude o abuso y resolver problemas técnicos.",
      "Cumplir obligaciones legales y responder a requerimientos válidos de autoridades.",
    ],
  },
  {
    heading: "4. Base y carácter de los datos",
    paragraphs: [
      "Tratamos los datos para prestar las funciones que solicitas, con tu consentimiento cuando corresponda y para cumplir obligaciones legales. Algunos datos de cuenta son necesarios para crearla o gestionar una orden. Si no los proporcionas, esas funciones pueden no estar disponibles.",
    ],
  },
  {
    heading: "5. Servicios de terceros y transferencias",
    paragraphs: [
      "Compartimos los datos mínimos necesarios con proveedores que ayudan a alojar y operar la plataforma, y con Google cuando eliges ese método de acceso. También podemos comunicarlos cuando una norma o autoridad competente lo requiera.",
      "Estos proveedores pueden procesar información desde otros países según la infraestructura que utilicen. Aplicamos las medidas y condiciones que correspondan para ese tratamiento.",
    ],
  },
  {
    heading: "6. Conservación y seguridad",
    paragraphs: [
      "Conservamos la información mientras sea necesaria para mantener la cuenta, gestionar servicios, resolver reclamos y cumplir obligaciones legales. Luego la eliminamos o la disociamos cuando corresponda, salvo que debamos conservarla por más tiempo según la ley.",
      "Aplicamos medidas de seguridad razonables para proteger los datos. Ningún sistema de transmisión o almacenamiento puede garantizar seguridad absoluta.",
    ],
  },
  {
    heading: "7. Tus derechos",
    paragraphs: [
      "Puedes solicitar acceso a tus datos personales, su actualización o rectificación, y su supresión cuando corresponda. También puedes retirar un consentimiento cuando el tratamiento se base en él, sin afectar lo realizado previamente.",
      "Para iniciar una solicitud, utiliza los canales de contacto publicados en el sitio e indica el correo asociado a tu cuenta y qué necesitas. Podemos pedir información adicional para verificar tu identidad. La Ley 25.326 reconoce el derecho de acceso y establece que su ejercicio es gratuito con la periodicidad prevista por la norma.",
      "La Agencia de Acceso a la Información Pública es el órgano de control de la Ley 25.326 y recibe denuncias y reclamos relacionados con la protección de datos personales.",
    ],
    references: [
      { label: "Ley 25.326 de Protección de Datos Personales", href: "https://www.argentina.gob.ar/normativa/nacional/64790/actualizacion" },
      { label: "Agencia de Acceso a la Información Pública", href: "https://www.argentina.gob.ar/aaip" },
    ],
  },
  {
    heading: "8. Cookies y sesión",
    paragraphs: [
      "Usamos almacenamiento técnico de sesión para mantenerte conectado y proteger el acceso a tu cuenta. Si incorporamos cookies o tecnologías no esenciales, actualizaremos esta política para explicar su finalidad y las opciones disponibles.",
    ],
  },
  {
    heading: "9. Cambios y contacto",
    paragraphs: [
      "Podemos actualizar esta política si cambian el servicio o las normas aplicables. Publicaremos aquí la fecha de la versión vigente. Para consultas sobre privacidad, utiliza los canales de contacto publicados en el sitio.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Política de privacidad"
      description="Esta política describe qué información personal trata Devta, para qué la utiliza y cómo puedes ejercer tus derechos."
      sections={sections}
    />
  );
}
