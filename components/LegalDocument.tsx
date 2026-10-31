import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  references?: { label: string; href: string }[];
};

export function LegalDocument({
  title,
  description,
  sections,
}: {
  title: string;
  description: string;
  sections: LegalSection[];
}) {
  return (
    <main className="min-h-screen bg-[#191919] px-5 py-7 text-white sm:px-8 sm:py-10">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4">
        <Link href="/" aria-label="Devta, inicio"><BrandLogo /></Link>
        <Link href="/register" className="text-sm text-white/75 underline-offset-4 hover:text-white hover:underline">Crear cuenta</Link>
      </div>

      <article className="mx-auto mt-12 w-full max-w-3xl pb-16 sm:mt-16">
        <Link href="/register" className="text-sm text-[#C9E94F] hover:underline">Volver al registro</Link>
        <h1 className="mt-5 font-heading text-2xl leading-relaxed sm:text-3xl">{title}</h1>
        <p className="mt-3 text-sm text-white/65">Última actualización: 31 de octubre de 2026</p>
        <p className="mt-7 max-w-2xl text-base leading-7 text-white/80">{description}</p>

        <div className="mt-10 space-y-9">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-heading text-base leading-relaxed text-white sm:text-lg">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm leading-7 text-white/75">{paragraph}</p>
              ))}
              {section.bullets && (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-white/75">
                  {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              )}
              {section.references && (
                <ul className="mt-3 space-y-2 text-sm">
                  {section.references.map((reference) => (
                    <li key={reference.href}>
                      <a href={reference.href} target="_blank" rel="noreferrer" className="text-[#C9E94F] underline underline-offset-4 hover:text-[#C9E94F]">
                        {reference.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <nav aria-label="Información legal" className="mt-14 flex flex-wrap gap-x-5 gap-y-3 border-t border-white/15 pt-5 text-sm">
          <Link href="/terminos-y-condiciones" className="text-white/70 hover:text-white">Términos y condiciones</Link>
          <Link href="/politica-de-privacidad" className="text-white/70 hover:text-white">Política de privacidad</Link>
        </nav>
      </article>
    </main>
  );
}
