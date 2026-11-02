import Link from "next/link";
import { ArrowUpRight, Code2, PanelsTopLeft, ShoppingBag, Workflow } from "lucide-react";
import { getActiveServices } from "@/app/actions/marketplace";
import { SERVICE_CATEGORIES } from "@/lib/service-categories";

const categoryIcons = {
  "programacion-web": Code2,
  automatizacion: Workflow,
  "saas-desde-cero": PanelsTopLeft,
  "tienda-online": ShoppingBag,
} as const;

export async function MarketplaceCatalog({ basePath }: { basePath: string }) {
  let services: Awaited<ReturnType<typeof getActiveServices>> = [];
  let unavailable = false;

  try {
    services = await getActiveServices();
  } catch {
    unavailable = true;
  }

  return (
    <main className="flex-1 px-4 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-20">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 max-w-3xl sm:mb-16">
          <h1 className="text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
            Encontrá el servicio para tu negocio.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Explorá por categoría, compará alcance, precio y plazo, y elegí el servicio que necesitás.
          </p>
        </header>

        {unavailable && (
          <p role="status" className="mb-6 rounded-lg border border-foreground/15 bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
            No pudimos cargar la cantidad de servicios. Elegí una categoría para volver a intentarlo.
          </p>
        )}

        <nav aria-label="Categorías de servicios" className="border-t border-foreground/15">
          {SERVICE_CATEGORIES.map((category) => {
            const Icon = categoryIcons[category.slug];
            const count = services.filter((service) => service.category === category.slug).length;

            return (
              <Link
                key={category.slug}
                href={`${basePath}/${category.slug}`}
                className="group grid gap-4 border-b border-foreground/15 py-6 transition-colors hover:bg-white/[0.025] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-green sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_auto_auto] sm:items-center sm:gap-8 sm:py-8 sm:px-4"
              >
                <span className="flex items-center gap-3">
                  <Icon aria-hidden="true" className="size-5 shrink-0 text-accent-green" strokeWidth={1.7} />
                  <span className="text-xl font-semibold tracking-tight sm:text-2xl">{category.title}</span>
                </span>
                <span className="max-w-lg text-sm leading-6 text-muted-foreground">{category.description}</span>
                <span className="text-xs text-foreground/65 sm:text-right">
                  {unavailable ? "Ver servicios" : `${count} ${count === 1 ? "servicio" : "servicios"}`}
                </span>
                <ArrowUpRight aria-hidden="true" className="hidden size-5 text-accent-green transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block" />
              </Link>
            );
          })}
        </nav>
      </div>
    </main>
  );
}
