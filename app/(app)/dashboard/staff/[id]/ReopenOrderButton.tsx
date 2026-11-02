"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { reopenStaffOrder } from "@/app/actions/dashboard";
import { Button } from "@/components/ui/button";

export function ReopenOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function reopen() {
    setError(null);
    startTransition(async () => {
      try {
        await reopenStaffOrder(orderId);
        router.refresh();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "No se pudo reabrir el pedido.");
      }
    });
  }

  return (
    <div className="mt-5">
      <Button type="button" variant="outline" onClick={reopen} disabled={pending}>
        <RotateCcw aria-hidden="true" className="mr-2 size-4" />
        {pending ? "Reabriendo…" : "Reabrir para corregir"}
      </Button>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
