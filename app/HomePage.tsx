import Link from "next/link";
import { ArrowUpRight, Code2, PanelsTopLeft, Plus, ShoppingBag, Workflow } from "lucide-react";
import { getPortfolioProjects } from "@/app/actions/marketplace";
import { getSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { ChromeLaptopDivider } from "@/components/chrome-laptop/ChromeLaptopDivider";
import Aurora from "@/components/ui/Aurora";
import CursorGrid from "@/components/ui/CursorGrid";
import ShapeGrid from "@/components/ShapeGrid";

const serviceTypes = [
  { title: "Programación Web", slug: "programacion-web", Icon: Code2 },
  { title: "Automatización", slug: "automatizacion", Icon: Workflow },
  { title: "SaaS desde cero", slug: "saas-desde-cero", Icon: PanelsTopLeft },
  { title: "Tienda Online", slug: "tienda-online", Icon: ShoppingBag },
];

const faqItems = [
  {
    question: "¿Qué pasa si algo no me gusta?",
    answer: "Cada servicio incluye una cantidad determinada de cambios. Encontrás el número de revisiones incluidas en los detalles de cada servicio.",
  },
  {
    question: "¿Qué pasa si algo en mi código falla?",
    answer: "Cada servicio pasa por una revisión de nuestro equipo. Antes de la entrega final y del pago restante, tenés un período de prueba para verificar que todo funcione como necesitás. Si encontrás errores, los corregimos sin costo. Si aparece una falla meses después, también la corregimos sin costo: contactanos y determinaremos si corresponde al código original que entregamos.",
  },
  {
    question: "¿De quién son los derechos comerciales y el código fuente?",
    answer: "En la mayoría de los servicios, los derechos de uso comercial y el código fuente son tuyos. Las opciones más económicas frente a sus alternativas más elaboradas están identificadas como “Marca blanca”. En esos servicios, Devta conserva el código fuente.",
  },
  {
    question: "¿Tengo que pagar por adelantado?",
    answer: "Sí. En la mayoría de los proyectos se abona entre el 25 % y el 50 % del valor total por adelantado para confirmar el inicio del trabajo.",
  },
  {
    question: "¿Quiénes son los desarrolladores?",
    answer: "Trabajamos con un equipo pequeño de profesionales seleccionados cuidadosamente. Asignamos cada proyecto según las habilidades necesarias y la complejidad del trabajo.",
  },
];

export default async function MarketplacePage() {
  const [portfolio, session] = await Promise.all([
    getPortfolioProjects()
      .then((services) => ({ services, unavailable: false }))
      .catch(() => ({ services: [], unavailable: true })),
    getSession(),
  ]);
  const portfolioItems = portfolio.services
    .flatMap((service) =>
      service.portfolioUrls.map((imageUrl, imageIndex) => ({
        service,
        imageUrl,
        imageIndex,
      }))
    )
    .sort((a, b) => b.service.createdAt.getTime() - a.service.createdAt.getTime());

  return (
    <main className="flex-1">
      <section className={`relative isolate flex items-center border-b border-foreground/10 bg-secondary/40 px-2 py-14 sm:px-8 sm:py-20 ${session ? "min-h-[55svh] sm:min-h-[60svh] lg:min-h-[82svh]" : "min-h-[calc(55svh+220px)] sm:min-h-[calc(60svh+220px)] md:min-h-[760px] lg:min-h-[max(780px,82svh)]"}`}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-[72px] z-10 h-[65%] overflow-hidden md:-top-24">
          <Aurora
            colorStops={["#C9E94F", "#91AD4D", "#D9E78B"]}
            amplitude={1.2}
            blend={0.5}
            brightness={0.72}
            height={0.38}
            layers={2}
            opacity={0.78}
            scale={0.52}
            speed={0.72}
          />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          <CursorGrid
            cellSize={68}
            color="#C9E94F"
            gridColor="#C9E94F"
            radius={180}
            maxOpacity={0.32}
            fillOpacity={0.018}
            gridOpacity={0.035}
            spotlight={0.58}
            edgeFade={0.4}
            clickPulse={false}
            intro={false}
            dpr={1}
          />
        </div>
        <div className={`relative z-20 mx-auto w-full max-w-7xl lg:max-w-none ${session ? "-translate-y-8 lg:-translate-y-24" : "-translate-y-[212px] sm:-translate-y-[212px] md:-translate-y-8 lg:-translate-y-24"}`}>
          <h1 className="mx-auto max-w-none text-center text-balance font-hero text-[clamp(1.75rem,9vw,7rem)] font-normal uppercase leading-[1.04] tracking-[-0.04em] lg:text-[clamp(2rem,3.5vw,4.25rem)]">
            <span className="block sm:inline lg:hidden">Tu equipo de</span>{" "}
            <span className="block sm:inline lg:hidden">desarrollo</span>{" "}
            <span className="block text-accent-green underline decoration-accent-green decoration-2 underline-offset-[0.12em] sm:inline lg:hidden">de bolsillo.</span>
            <span className="hidden whitespace-nowrap lg:block">Tu equipo de desarrollo</span>
            <span className="hidden text-accent-green underline decoration-accent-green decoration-2 underline-offset-[0.12em] lg:block">de bolsillo.</span>
          </h1>
        </div>

        {!session && (
          <nav aria-label="Acciones principales" className="absolute inset-x-0 bottom-4 z-20 mx-auto flex w-[min(92vw,760px)] flex-col gap-3 md:hidden">
            <p className="line-clamp-2 w-full whitespace-normal text-balance text-center text-[clamp(1.1rem,6vw,1.5rem)] font-medium leading-relaxed tracking-tight text-foreground/80 md:text-[clamp(1rem,2vw,1.7rem)]">
              Armar un proyecto <span className="underline decoration-accent-green decoration-2 underline-offset-4">NÚNCA</span> fue tan simple, rápido y confiable.
            </p>
            <Button
              render={<Link href="/register" />}
              nativeButton={false}
              className="h-[52px] w-full rounded-xl border-accent-green bg-accent-green px-5 font-sans text-black hover:bg-accent-green/90 hover:text-black"
            >
              Comenzá sin costo
            </Button>
            <Button
              render={<Link href="/login" />}
              nativeButton={false}
              variant="outline"
              className="h-[52px] w-full rounded-xl border-accent-green bg-transparent px-5 font-sans text-accent-green hover:bg-accent-green/10 hover:text-accent-green"
            >
              Iniciar sesión
            </Button>
          </nav>
        )}
        {!session && (
          <nav aria-label="Acciones principales" className="absolute bottom-[20%] left-1/2 z-20 mx-auto hidden w-[min(92vw,760px)] -translate-x-1/2 flex-row flex-wrap justify-center gap-3 px-1 md:flex">
            <p className="line-clamp-2 w-full whitespace-normal text-balance text-center text-[clamp(1.1rem,6vw,1.5rem)] font-medium leading-relaxed tracking-tight text-foreground/80 md:text-[clamp(1rem,2vw,1.7rem)]">
              Armar un proyecto <span className="underline decoration-accent-green decoration-2 underline-offset-4">NÚNCA</span> fue tan simple, rápido y confiable.
            </p>
            <Button
              render={<Link href="/register" />}
              nativeButton={false}
              className="h-[52px] min-w-0 flex-1 rounded-xl border-accent-green bg-accent-green px-2 font-sans text-xl text-black hover:bg-accent-green/90 hover:text-black md:text-2xl sm:px-4"
            >
              Comenzá sin costo
            </Button>
            <Button
              render={<Link href="/login" />}
              nativeButton={false}
              variant="outline"
              className="h-[52px] min-w-0 flex-1 rounded-xl border-accent-green bg-transparent px-2 font-sans text-xl text-accent-green hover:bg-accent-green/10 hover:text-accent-green md:text-2xl sm:px-4"
            >
              Iniciar sesión
            </Button>
          </nav>
        )}
        <ChromeLaptopDivider reserveCtaSpace={!session} />
      </section>

      <section aria-labelledby="portfolio-title" className="px-4 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 flex flex-col items-start justify-between gap-3 border-b border-foreground/10 pb-4 sm:mb-9 sm:flex-row sm:items-end">
            <h2 id="portfolio-title" className="w-full max-w-4xl text-balance text-[clamp(1.05rem,5vw,2.35rem)] font-normal leading-[1.15] tracking-[-0.025em] sm:w-auto">
              <span className="block whitespace-nowrap">PORTFOLIO <span className="text-accent-green">&amp;</span></span>
              <span className="block whitespace-nowrap">TRABAJOS RECIENTES</span>
            </h2>
          </div>

          {portfolioItems.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">
              {portfolio.unavailable
                ? "No pudimos cargar los trabajos. Volvé a intentar en unos minutos."
                : "Estamos preparando los primeros trabajos para mostrarte."}
            </p>
          ) : (
            <div className="portfolio-marquee" role="region" aria-label="Trabajos recientes">
              <div className="portfolio-track">
                <div className="portfolio-set">
                  {portfolioItems.map(({ service, imageUrl, imageIndex }) => (
                    <Link
                      key={`${service.id}-${imageIndex}`}
                      href="/register"
                      className="portfolio-card group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-green"
                      aria-label={`Registrarte desde el trabajo: ${service.title}`}
                    >
                      <div className="overflow-hidden rounded-xl bg-secondary/60">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt={`Captura ${imageIndex + 1} del sitio web ${service.title}`}
                          className="aspect-[2.3/1] w-full object-cover"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="portfolio-set portfolio-set-clone" aria-hidden="true">
                  {portfolioItems.map(({ service, imageUrl, imageIndex }) => (
                    <div key={`${service.id}-${imageIndex}`} className="portfolio-card">
                      <div className="overflow-hidden rounded-xl bg-secondary/60">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt="" className="aspect-[2.3/1] w-full object-cover" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <hr aria-hidden="true" className="mx-auto w-[calc(100%-2rem)] max-w-7xl border-foreground/10 sm:w-[calc(100%-4rem)]" />

      <section id="servicios" className="relative isolate scroll-mt-20 overflow-hidden px-4 pb-12 pt-12 sm:px-8 sm:pb-16 sm:pt-16 lg:pt-24">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <ShapeGrid
            cellSize={48}
            lineWidth={1}
            direction="diagonal"
            speed={0.12}
            lineColor="rgba(255,255,255,0.12)"
            hoverColor="#C9E94F"
            fillOpacity={0.06}
            rainbow={false}
            trail={0.45}
            glow={0.18}
            twinkle={0}
            fade={0.15}
            clickCascade={false}
            intro={false}
            opacity={0.58}
            dpr={1}
          />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-7 flex items-end justify-between gap-4 border-b border-foreground/10 pb-4">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Servicios</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {serviceTypes.map(({ title, slug, Icon }) => (
              <article
                key={title}
                className="group flex min-h-52 flex-col justify-between overflow-hidden rounded-xl border border-foreground/10 bg-card p-5 transition-colors hover:border-primary/40 hover:bg-secondary/60 motion-reduce:transition-none"
              >
                <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-xl border border-accent-green/30 bg-accent-green/5 text-accent-green">
                  <Icon className="size-5" strokeWidth={1.8} />
                </span>
                <span>
                  <span className="mb-3 block text-lg font-semibold leading-snug tracking-tight">{title}</span>
                  <Link
                    href={`/marketplace/${slug}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent-green px-3 py-2 font-sans text-xs font-semibold text-black transition-colors hover:bg-accent-green/85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-green"
                  >
                    Solicitar {title}
                    <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="start-title" className="border-t border-foreground/10 px-4 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-green">Cómo empezar</p>
            <h2 id="start-title" className="mt-3 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              Contratá tu servicio en tres pasos
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Elegí lo que necesitás, contanos los detalles y coordiná con el desarrollador desde la plataforma.
            </p>
          </div>

          <ol className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            <li className="flex min-h-56 flex-col items-center rounded-2xl border border-accent-green/30 bg-card p-6 text-center transition-colors hover:border-accent-green/65 motion-reduce:transition-none">
              <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full border border-accent-green/30 bg-accent-green/10 text-lg font-semibold text-accent-green">1</span>
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-green">Paso 1</p>
              <h3 className="mt-2 text-lg font-semibold">Creá tu cuenta</h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Registrate para empezar y seguir tu pedido desde tu espacio.
              </p>
            </li>
            <li className="flex min-h-56 flex-col items-center rounded-2xl border border-accent-green/30 bg-card p-6 text-center transition-colors hover:border-accent-green/65 motion-reduce:transition-none">
              <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full border border-accent-green/30 bg-accent-green/10 text-lg font-semibold text-accent-green">2</span>
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-green">Paso 2</p>
              <h3 className="mt-2 text-lg font-semibold">Elegí un servicio</h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Detallá lo que necesitás y abrí un ticket con tus especificaciones.
              </p>
            </li>
            <li className="flex min-h-56 flex-col items-center rounded-2xl border border-accent-green/30 bg-card p-6 text-center transition-colors hover:border-accent-green/65 motion-reduce:transition-none">
              <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full border border-accent-green/30 bg-accent-green/10 text-lg font-semibold text-accent-green">3</span>
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-green">Paso 3</p>
              <h3 className="mt-2 text-lg font-semibold">Recibí tu servicio</h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Conversá en tiempo real y seguí el trabajo hasta que tu servicio esté completo.
              </p>
            </li>
          </ol>

          <div className="mt-8 flex justify-center">
            <Link
              href="/register"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent-green px-6 py-3 font-sans text-xs font-semibold text-black transition-colors hover:bg-accent-green/85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-green"
            >
              Registrarme
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="border-t border-foreground/10 px-4 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-green">Aclaramos tus dudas</p>
            <h2 id="faq-title" className="mt-3 max-w-sm font-heading text-xl leading-relaxed sm:text-2xl">
              Preguntas frecuentes
            </h2>
          </div>

          <div className="divide-y divide-foreground/10 border-y border-foreground/10">
            {faqItems.map(({ question, answer }) => (
              <details key={question} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-base font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-green sm:py-6 sm:text-lg [&::-webkit-details-marker]:hidden">
                  {question}
                  <Plus aria-hidden="true" className="size-5 shrink-0 text-accent-green transition-transform group-open:rotate-45 motion-reduce:transition-none" />
                </summary>
                <p className="max-w-3xl pb-6 pr-10 text-sm leading-7 text-muted-foreground sm:text-base">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
