import Image from "next/image";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { portfolioCategories, portfolioProjects } from "@/lib/portfolio-projects";

export const metadata: Metadata = {
  title: "Devta",
  description: "Proyectos web, tiendas online y sistemas a medida realizados por Devta.",
};

export default function PortfolioPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-12 md:px-8 md:pt-20">
      <header className="mb-14 max-w-4xl md:mb-20">
        <p className="mb-5 text-xs uppercase tracking-[0.2em] text-accent-green">Devta</p>
        <h1 className="max-w-4xl text-4xl leading-[1.12] tracking-[-0.035em] sm:text-5xl md:text-6xl">
          Ideas que ya están <span className="text-accent-green">en marcha.</span>
        </h1>
        <div className="mt-7 flex flex-col gap-6 border-t border-white/15 pt-5 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-2xl text-base leading-7 text-white/70 md:text-lg">
            Sitios, tiendas y sistemas creados para resolver desafíos reales de cada negocio.
          </p>
          <nav aria-label="Categorías de proyectos" className="flex flex-wrap gap-2">
            {portfolioCategories.map((category) => (
              <a key={category} href={`#${category.toLowerCase().replaceAll(" ", "-")}`} className="rounded-full border border-white/15 px-3 py-2 text-xs text-white/75 transition-colors hover:border-accent-green/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green">
                {category}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="space-y-20 md:space-y-28">
        {portfolioCategories.map((category) => {
          const projects = portfolioProjects.filter((project) => project.category === category);
          return (
            <section key={category} id={category.toLowerCase().replaceAll(" ", "-")} className="scroll-mt-28">
              <div className="mb-7 flex items-end justify-between gap-4 border-b border-white/15 pb-4">
                <h2 className="text-2xl tracking-[-0.03em] md:text-3xl">{category}</h2>
                <span className="text-sm tabular-nums text-white/50">{String(projects.length).padStart(2, "0")} proyectos</span>
              </div>
              <div className="grid gap-x-6 gap-y-12 md:grid-cols-2 md:gap-y-16">
                {projects.map((project) => (
                  <article key={project.id} className="group min-w-0">
                    <a href={project.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${project.name} en una pestaña nueva`} className="relative block aspect-[1.62] overflow-hidden rounded-xl bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-green">
                      <Image src={project.cover} alt={`Portada de ${project.name}`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025] motion-reduce:transition-none" />
                      <span className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full bg-black/80 text-white transition-transform duration-300 group-hover:-translate-y-1" aria-hidden="true"><ArrowUpRight className="size-5" /></span>
                    </a>
                    <div className="mt-5 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl tracking-[-0.025em] md:text-2xl">{project.name}</h3>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 md:text-base md:leading-7">{project.description}</p>
                      </div>
                      <span className="mt-1 shrink-0 text-xs uppercase tracking-[0.12em] text-accent-green">Web ↗</span>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3" aria-label={`Más vistas de ${project.name}`}>
                      {project.gallery.map((image, index) => (
                        <div key={image} className="relative aspect-[1.7] overflow-hidden rounded-lg bg-white/[0.04]">
                          <Image src={image} alt={`${project.name}, vista ${index + 1}`} fill sizes="(max-width: 768px) 45vw, 23vw" className="object-cover" />
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
