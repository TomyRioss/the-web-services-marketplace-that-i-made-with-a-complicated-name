import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

const footerLinks = {
  Explorar: [
    { label: "Servicios", href: "/marketplace" },
    { label: "Portfolio", href: "/portfolio" },
  ],
  Información: [
    { label: "Términos y condiciones", href: "/terminos-y-condiciones" },
    { label: "Política de privacidad", href: "/politica-de-privacidad" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/[0.08] bg-[#101112] text-white">
      <div className="mx-auto max-w-7xl px-6 pb-6 pt-12 sm:px-8 sm:pt-14 lg:px-10 lg:pt-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(160px,0.6fr)_minmax(220px,0.8fr)] lg:gap-8">
          <div className="col-span-2 max-w-sm lg:col-span-1">
            <Link href="/marketplace" aria-label="Devta, inicio" className="inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C9E94F]">
              <BrandLogo inverse size="large" />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/55">
              Desarrollo digital claro, cercano y pensado para hacer crecer tu negocio.
            </p>
            <Link
              href="/marketplace"
              className="mt-6 inline-flex min-h-10 items-center rounded-md border border-white/15 px-4 font-sans text-[9px] uppercase tracking-[0.04em] text-white/85 transition-colors hover:border-[#C9E94F]/60 hover:text-[#C9E94F] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C9E94F]"
            >
              Explorar servicios <span aria-hidden="true" className="ml-3 text-[#C9E94F]">↗</span>
            </Link>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <nav key={heading} aria-label={heading}>
              <h2 className="font-[family-name:var(--font-michroma)] text-[10px] uppercase tracking-[0.14em] text-white/80">
                {heading}
              </h2>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/55 transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C9E94F]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/[0.08] pt-5 text-xs text-white/50 sm:mt-14 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Devta</span>
          <span>Hecho para impulsar tu próximo proyecto.</span>
        </div>
      </div>
    </footer>
  );
}
