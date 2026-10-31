import { Clock, Code2, ImageOff } from "lucide-react";
import { getActiveServices } from "@/app/actions/marketplace";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServiceCardActions } from "./ServiceCardActions";

const currencyArs = new Intl.NumberFormat("es-AR");

export default async function DashboardServicesPage() {
  const { services, unavailable } = await getActiveServices()
    .then((list) => ({ services: list, unavailable: false }))
    .catch(() => ({ services: [], unavailable: true }));

  return (
    <main className="px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background px-3 py-1 text-xs font-medium text-primary">
          <Code2 className="size-3.5" />
          Catálogo
        </p>
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          Servicios que podés pedir
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Elegí un servicio, contanos qué necesitás y seguimiento desde este mismo panel.
        </p>

        {unavailable ? (
          <div className="mt-8 rounded-xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
            No pudimos cargar el catálogo. Reintentá en unos minutos.
          </div>
        ) : services.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
            Todavía no hay servicios publicados.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {services.map((service) => (
              <Card key={service.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold leading-snug">{service.title}</h2>
                    <Badge variant="secondary">${currencyArs.format(service.priceUsd)} USD</Badge>
                  </div>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{service.description}</p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="size-3.5" />
                      {service.deliveryDays} días
                      <span className="text-foreground/40">·</span>
                      ${currencyArs.format(service.priceArs)} ARS
                    </span>
                    <ServiceCardActions serviceId={service.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {services.length === 0 && !unavailable && (
          <div className="mt-8 flex justify-center text-muted-foreground">
            <ImageOff className="size-6" />
          </div>
        )}
      </div>
    </main>
  );
}
