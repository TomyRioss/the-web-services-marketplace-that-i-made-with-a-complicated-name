"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { closeApprovedOrder } from "@/app/actions/order-review";
import { Button } from "@/components/ui/button";

export function OrderClosePanel({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function closeOrder() {
    setError(null);
    startTransition(async () => {
      try {
        await closeApprovedOrder(orderId);
        router.refresh();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "No se pudo cerrar el pedido.");
      }
    });
  }

  return (
    <section className="border-b border-accent-green/25 bg-accent-green/[0.04] px-3 py-4">
      <h2 className="font-heading text-xs leading-6">Pago confirmado y materiales enviados</h2>
      <p className="mt-1 text-sm text-muted-foreground">Cerrá el pedido para marcarlo como terminado.</p>
      <Button type="button" disabled={pending} onClick={closeOrder} className="mt-3 min-h-10 bg-accent-green font-heading text-xs text-background hover:bg-accent-green/90">
        {pending ? "Cerrando pedido…" : "Cerrar pedido"}
      </Button>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </section>
  );
}
