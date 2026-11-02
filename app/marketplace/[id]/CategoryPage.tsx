import Link from "next/link";
import { ArrowLeft, ImageOff, ShoppingCart } from "lucide-react";
import { getServicesByCategory } from "@/app/actions/marketplace";
import { Button } from "@/components/ui/button";

const currencyArs = new Intl.NumberFormat("es-AR");

export async function CategoryPage({ slug, basePath }: { slug: string; basePath: string }) {
  const result = await getServicesByCategory(slug);
  if (!result) return null;
  const { category, services } = result;

  return (
    <main className="flex-1 px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <Button render={<Link href={basePath} />} nativeButton={false} variant="ghost" size="sm">
          <ArrowLeft className="size-4" />Marketplace
        </Button>
        <header className="mb-10 mt-6 max-w-3xl">
          <p className="font-heading text-xs uppercase tracking-[0.18em] text-accent-green">Marketplace / Servicios</p>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">{category.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{category.description}</p>
        </header>

        {services.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-foreground/20 bg-card/60 px-6 py-14 text-center">
            <h2 className="text-xl font-semibold">Estamos preparando los servicios</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">Podés contarnos qué necesitás y armamos una propuesta a medida para tu negocio.</p>
            <Button render={<Link href="/personalizado" />} nativeButton={false} className="mt-6">Pedir una propuesta</Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <article key={service.id} className="group flex min-h-[430px] flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-card transition-colors hover:border-accent-green/40">
                <div className="relative aspect-[1.8/1] w-full overflow-hidden bg-secondary/70">
                  {service.portfolioUrls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={service.portfolioUrls[0]} alt={`Preview de ${service.title}`} className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.025]" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-foreground/30">
                      <ImageOff className="size-8" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="font-sans text-2xl font-semibold tracking-tight">{service.title}</h2>
                  <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                  <div className="mt-6 flex items-center justify-between gap-3 border-t border-foreground/10 pt-4">
                    <span className="text-lg font-semibold">${currencyArs.format(service.priceArs)} ARS</span>
                    <span className="text-sm text-muted-foreground">${currencyArs.format(service.priceUsd)} USD</span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="flex min-w-0 items-center justify-center px-1 py-2.5 text-center text-xs font-medium sm:text-sm">
                      Duración: {service.deliveryDays} días
                    </div>
                    <Button render={<Link href={`${basePath}/${service.id}`} />} nativeButton={false} className="h-auto w-full bg-[#C9E94F] px-3 py-2.5 font-sans text-[#171717] hover:bg-[#b6d239]">
                      <ShoppingCart className="size-4 shrink-0" />
                      Pedir ahora
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent-green/20 bg-accent-green/5 p-6">
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">¿No encontraste lo que buscabas? Contanos tu idea y te respondemos dentro de las próximas 24 horas.</p>
          <Button render={<Link href="/personalizado" />} nativeButton={false} variant="outline" className="border-accent-green/40">Describir mi proyecto</Button>
        </div>
      </div>
    </main>
  );
}
