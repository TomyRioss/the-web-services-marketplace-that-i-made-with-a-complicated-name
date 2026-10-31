"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteService } from "@/app/actions/marketplace";

export function DeleteServiceButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => {
          if (!confirm("¿Eliminar este servicio?")) return;
          setError(null);
          startTransition(async () => {
            try {
              await deleteService(id);
            } catch {
              setError("No se puede eliminar: tiene pedidos asociados. Desactivalo en su lugar.");
            }
          });
        }}
      >
        <Trash2 className="size-4" />
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
