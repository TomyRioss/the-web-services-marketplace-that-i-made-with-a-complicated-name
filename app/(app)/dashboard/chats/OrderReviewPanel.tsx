"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { approveOrderReview } from "@/app/actions/order-review";
import { Button } from "@/components/ui/button";

export function OrderReviewPanel({ orderId, previewUrl, approved, closed }: { orderId: string; previewUrl: string | null; approved: boolean; closed: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  function approve() {
    setError(null);
    setNotice("");
    startTransition(async () => {
      try {
        await approveOrderReview(orderId);
        setNotice("Página aprobada. El administrador u owner coordinará el pago restante.");
        router.refresh();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "No se pudo cerrar el pedido.");
      }
    });
  }

  return (
    <section aria-labelledby="order-review-heading" className="border-b border-accent-green/25 bg-accent-green/[0.04] px-3 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="order-review-heading" className="flex items-center gap-2 font-heading text-xs leading-6">
            {approved && <CheckCircle2 aria-hidden="true" className="size-4 text-accent-green" />}
            {closed ? "Pedido cerrado" : approved ? "Página aprobada" : "Revisá tu proyecto"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {closed ? "La entrega final se envió y el pedido está terminado." : approved ? "La página está aprobada. Admin u owner coordinará el saldo restante y la entrega final." : "Probá la página y aprobala cuando estés conforme."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {previewUrl && <Button render={<a href={previewUrl} target="_blank" rel="noreferrer" />} nativeButton={false} variant="outline" className="min-h-10">
            <ExternalLink aria-hidden="true" className="mr-2 size-4" /> Abrir página
          </Button>}
          {!approved && <Button type="button" disabled={pending} onClick={approve} className="min-h-10 bg-accent-green font-heading text-xs text-background hover:bg-accent-green/90">
            {pending ? "Aprobando…" : "Aprobar página"}
          </Button>}
        </div>
      </div>
      {!previewUrl && !approved && <p className="mt-2 text-xs text-muted-foreground">El desarrollador indicó que no hay un enlace de prueba disponible.</p>}
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-accent-green">{notice}</p>}
    </section>
  );
}
