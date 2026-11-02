import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getStaffOrderDetails } from "@/app/actions/dashboard";
import { Badge } from "@/components/ui/badge";
import { COMMUNICATION_PREFERENCE_LABELS } from "@/lib/order-preferences";
import { STATUS_META, formatDate, formatDateTime } from "../../ui-helpers";
import { CompleteOrderForm } from "./CompleteOrderForm";
import { ReopenOrderButton } from "./ReopenOrderButton";

export default async function StaffOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!["DEV", "ADMIN", "OWNER"].includes(session.role)) redirect("/dashboard");
  const { id } = await params;

  let order: Awaited<ReturnType<typeof getStaffOrderDetails>>;
  try {
    order = await getStaffOrderDetails(id);
  } catch {
    redirect("/dashboard/staff");
  }
  const customerMessage = order.message.replace(
    /\n\nPreferencia de comunicación: (?:Quiero que me hablen|Trabajo autónomo)(?=\n|$)/,
    "",
  );

  return (
    <main className="min-h-full w-full px-4 py-8 sm:px-8 sm:py-10">
      <div className="w-full">
        <Link href="/dashboard/staff" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft aria-hidden="true" className="size-4" /> Volver a pedidos del equipo
        </Link>

        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-foreground/10 pb-6">
          <div>
            <h1 className="font-heading text-2xl tracking-tight sm:text-3xl">{order.serviceTitle}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Pedido recibido el {formatDate(order.createdAt)}</p>
          </div>
          <Badge className={STATUS_META[order.status].className}>{STATUS_META[order.status].label}</Badge>
        </header>

        {(order.status === "REVIEW" || order.status === "APPROVED" || order.status === "DONE") && (
          <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent-green/40 bg-accent-green/[0.08] px-5 py-4 shadow-[0_0_28px_-18px_#C9E94F]">
            <div className="flex items-start gap-3">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-accent-green" />
              <div>
                <h2 className="font-heading text-sm font-semibold text-accent-green">{order.status === "REVIEW" ? "Entrega enviada, en revisión" : order.status === "APPROVED" ? "El cliente aprobó la página" : "Pedido cerrado por admin u owner"}</h2>
                <p className="mt-1 text-sm text-foreground/75">{order.status === "REVIEW" ? "El cliente debe revisar y aprobar la página." : order.status === "APPROVED" ? "Admin u owner coordina el saldo y la entrega final." : "El pedido está cerrado."} Si necesitás corregir algo, podés reabrirlo.</p>
                <p className="mt-1 text-xs text-muted-foreground">Actualizado el {formatDateTime(order.updatedAt)}{order.deliverables?.demoDuration ? ` · Demo: ${Math.floor(order.deliverables.demoDuration)} segundos.` : ""}</p>
              </div>
            </div>
            {(session.role !== "DEV" || order.status === "REVIEW") && <ReopenOrderButton orderId={order.id} />}
          </section>
        )}

        <div className="py-7">
          <div className="max-w-4xl space-y-8">
            <section>
              <h2 className="text-lg font-semibold">Lo que necesita el cliente</h2>
              <div className="mt-3 rounded-xl border border-foreground/10 bg-card px-5 py-4">
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground/85">{customerMessage || "El cliente no agregó una descripción."}</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Preferencia de comunicación</h2>
              <div className="mt-3 rounded-xl border border-foreground/10 bg-card px-5 py-4">
                <p className="text-sm leading-6 text-foreground/85">
                  {order.communicationPreference
                    ? COMMUNICATION_PREFERENCE_LABELS[order.communicationPreference]
                    : "El cliente no indicó una preferencia."}
                </p>
              </div>
            </section>

            {order.attachmentLinks.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold">Imágenes de referencia</h2>
                <ul className="mt-3 flex flex-wrap gap-3">
                  {order.attachmentLinks.map((attachment, index) => (
                    <li key={attachment.id}>
                      <a href={attachment.href} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-xl border border-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green">
                        <Image src={attachment.href} alt={`Referencia del cliente ${index + 1}`} width={240} height={160} unoptimized className="h-36 w-56 object-cover transition-transform group-hover:scale-[1.03]" />
                        <span className="block px-3 py-2 text-xs text-muted-foreground">Abrir imagen {index + 1}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h2 className="text-lg font-semibold">Nota de quien delegó</h2>
              <div className="mt-3 rounded-xl border border-accent-green/20 bg-accent-green/[0.04] px-5 py-4">
                {order.assignmentNote ? (
                  <>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">{order.assignmentNote}</p>
                    <p className="mt-3 text-xs text-muted-foreground">Asignado por {order.assignedByName}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay notas para este pedido.</p>
                )}
              </div>
            </section>

            {order.deliverables && (
              <section className="border-t border-foreground/10 pt-7">
                <h2 className="text-lg font-semibold">
                  {order.status === "DONE" ? "Entrega aprobada" : order.status === "REVIEW" ? "Entrega enviada para revisión" : "Versión anterior de la entrega"}
                </h2>
                <a href={order.deliverables.repositoryUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm text-accent-green underline underline-offset-4">
                  Abrir repositorio de GitHub
                </a>
                {order.deliverables.screenshots.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-3">
                    {order.deliverables.screenshots.map((screenshot, index) => (
                      <li key={screenshot.name}>
                        <a href={screenshot.href} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green">
                          <Image src={screenshot.href} alt={`Captura de la entrega ${index + 1}`} width={320} height={220} unoptimized className="h-44 w-64 object-cover" />
                          <span className="block px-3 py-2 text-xs text-muted-foreground">Ver captura {index + 1}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                {order.deliverables && (
                  <p className="mt-4 text-sm">
                    Página para probar:{" "}
                    {order.deliverables.previewUrl === "N/A"
                      ? <span className="text-muted-foreground">N/A</span>
                      : <a href={order.deliverables.previewUrl} target="_blank" rel="noreferrer" className="text-accent-green underline underline-offset-4">Abrir página</a>}
                  </p>
                )}
                {order.deliverables.demoVideoHref && (
                  <video controls preload="metadata" className="mt-4 max-h-[min(65vh,640px)] w-full max-w-3xl rounded-xl border border-foreground/15 bg-black" src={order.deliverables.demoVideoHref}>
                    Tu navegador no puede reproducir este video.
                  </video>
                )}
              </section>
            )}

            {session.role === "DEV" && order.status !== "REVIEW" && order.status !== "APPROVED" && order.status !== "DONE" && order.status !== "CANCELLED" && (
              <CompleteOrderForm
                orderId={order.id}
                showTestButton={process.env.NODE_ENV !== "production"}
                initialRepositoryUrl={order.deliverables?.repositoryUrl ?? ""}
                initialPreviewUrl={order.deliverables?.previewUrl ?? ""}
                isRevision={Boolean(order.deliverables)}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
