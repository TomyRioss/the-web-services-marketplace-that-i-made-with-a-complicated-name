"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Plus, X } from "lucide-react";
import { OrderForm } from "@/app/marketplace/[id]/OrderForm";
import { Button } from "@/components/ui/button";

export function ServiceCardActions({ serviceId }: { serviceId: string }) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border bg-accent/40 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Pedir este servicio</p>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} aria-label="Cerrar formulario">
            <X className="size-4" />
          </Button>
        </div>
        <OrderForm serviceId={serviceId} />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Pedir
      </Button>
      <Button
        render={<Link href={`/marketplace/${serviceId}`} />}
        nativeButton={false}
        variant="outline"
        size="sm"
      >
        <ExternalLink className="size-4" />
        Detalle
      </Button>
    </div>
  );
}
