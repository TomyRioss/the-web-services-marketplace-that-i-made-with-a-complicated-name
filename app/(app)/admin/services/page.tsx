import { getAllServices } from "@/app/actions/marketplace";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceForm } from "./ServiceForm";
import { DeleteServiceButton } from "./DeleteServiceButton";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ServicePrice } from "@/app/marketplace/ServicePrice";

export default async function AdminServicesPage() {
  const session = await getSession();
  if (session?.role !== "OWNER" && session?.role !== "ADMIN") redirect(session ? "/admin/orders" : "/login");
  const services = await getAllServices();

  return (
    <main className="flex-1 overflow-y-auto px-4 py-10 sm:px-8 sm:py-14">
      <div className="w-full max-w-none">
        <div className="flex items-center justify-between">
          <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Servicios
          </h1>
          <ServiceForm />
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {services.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No hay servicios cargados.
              </CardContent>
            </Card>
          ) : (
            services.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {service.title}
                        {!service.active && <Badge variant="outline">Inactivo</Badge>}
                      </CardTitle>
                      <div className="mt-2 flex flex-wrap items-center gap-4">
                        <ServicePrice service={service} />
                        <span className="text-sm text-muted-foreground">Duración: {service.deliveryDays} días hábiles</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <ServiceForm service={service} />
                      <DeleteServiceButton id={service.id} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
