import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, ExternalLink, LogIn } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getServiceById, type ServiceReference } from "@/app/actions/marketplace";
import { Button } from "@/components/ui/button";
import { OrderForm } from "./OrderForm";
import { Gallery } from "./Gallery";

const currencyArs = new Intl.NumberFormat("es-AR");

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, service] = await Promise.all([getSession(), getServiceById(id)]);

  if (!service) notFound();

  const references = service.references as ServiceReference[];


  return (
    <main className="flex-1 px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <Button render={<Link href="/marketplace" />} nativeButton={false} variant="ghost" size="sm">
          <ArrowLeft className="size-4" />
          Marketplace
        </Button>

        <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              {service.title}
            </h1>
            <p className="mt-3 max-w-[70ch] text-pretty leading-relaxed text-muted-foreground">
              {service.description}
            </p>

            <div className="mt-8">
              <Gallery title={service.title} images={service.portfolioUrls as string[]} />
            </div>

            {references.length > 0 && (
              <div className="mt-8">
                <h2 className="text-sm font-semibold">Referencias</h2>
                <div className="mt-3 flex flex-col gap-2">
                  {references.map((ref) => (
                    <a
                      key={ref.url}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-primary hover:underline"
                    >
                      {ref.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={ref.imageUrl}
                          alt=""
                          className="size-10 shrink-0 rounded object-cover ring-1 ring-foreground/10"
                        />
                      ) : (
                        <ExternalLink className="size-3.5 shrink-0" />
                      )}
                      <span className="truncate">{ref.url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-14 lg:self-start">
            <div className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10">
              <p className="font-heading text-2xl font-semibold tracking-tight">
                ${currencyArs.format(service.priceArs)}{" "}
                <span className="text-base font-normal text-muted-foreground">ARS</span>
              </p>
              <p className="text-sm text-muted-foreground">${service.priceUsd} USD</p>

              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4" />
                Entrega en {service.deliveryDays} días hábiles
              </div>

              <div className="mt-5 border-t pt-5">
                {session ? (
                  <OrderForm serviceId={service.id} />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <p className="text-sm text-muted-foreground">
                      Iniciá sesión para pedir este servicio.
                    </p>
                    <Button render={<Link href="/login" />} nativeButton={false} className="w-full">
                      <LogIn className="size-4" />
                      Iniciar sesión
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
