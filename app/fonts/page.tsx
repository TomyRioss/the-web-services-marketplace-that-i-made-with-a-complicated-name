import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Devta",
};

const fontFamilies = [
  { name: "Space Grotesk", family: "'Space Grotesk', sans-serif" },
  { name: "Sora", family: "'Sora', sans-serif" },
  { name: "Manrope", family: "'Manrope', sans-serif" },
  { name: "Plus Jakarta Sans", family: "'Plus Jakarta Sans', sans-serif" },
  { name: "Outfit", family: "'Outfit', sans-serif" },
  { name: "Urbanist", family: "'Urbanist', sans-serif" },
  { name: "Exo 2", family: "'Exo 2', sans-serif" },
  { name: "Chakra Petch", family: "'Chakra Petch', sans-serif" },
  { name: "Oxanium", family: "'Oxanium', sans-serif" },
  { name: "Rajdhani", family: "'Rajdhani', sans-serif" },
  { name: "Michroma", family: "'Michroma', sans-serif" },
  { name: "IBM Plex Sans", family: "'IBM Plex Sans', sans-serif" },
];

const googleFontsUrl =
  "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Chakra+Petch:wght@400;500;600;700&family=Exo+2:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Michroma&family=Oxanium:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Rajdhani:wght@400;500;600;700&family=Sora:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Urbanist:wght@400;500;600;700&display=swap";

export default function FontComparisonPage() {
  return (
    <>
      <link rel="stylesheet" href={googleFontsUrl} />
      <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-8 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-foreground/10 pb-6 sm:mb-10">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Devta
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                12 tipografías para el CTA
              </h1>
            </div>
            <Link
              href="/marketplace"
              className="text-sm font-medium text-muted-foreground underline decoration-foreground/20 underline-offset-4 transition-colors hover:text-foreground"
            >
              Volver al sitio
            </Link>
          </header>

          <section aria-label="Comparación de tipografías" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fontFamilies.map((font, index) => (
              <article
                key={font.name}
                className="flex min-h-44 flex-col justify-between rounded-xl border border-foreground/10 bg-secondary/35 p-5 sm:p-6"
              >
                <div className="flex items-center justify-between gap-4 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>{font.name}</span>
                </div>
                <p
                  className="mt-8 text-[clamp(1.65rem,3vw,2.5rem)] font-semibold leading-[1.04] tracking-[-0.035em]"
                  style={{ fontFamily: font.family }}
                >
                  Tú equipo de desarrollo de bolsillo.
                </p>
              </article>
            ))}
          </section>
        </div>
      </main>
    </>
  );
}
