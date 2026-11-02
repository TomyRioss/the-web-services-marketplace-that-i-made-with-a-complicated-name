"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateDeveloperAccess } from "@/app/actions/admin";

export function UserDeveloperToggle({ userId, enabled }: { userId: string; enabled: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  return (
    <div className="flex min-w-52 flex-col items-start gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          setMessage("");
          setError(false);
          startTransition(async () => {
            try {
              await updateDeveloperAccess(userId, !enabled);
              setMessage(enabled ? "Acceso quitado." : "Habilitado. Debe iniciar sesión nuevamente.");
            } catch (cause) {
              setMessage(cause instanceof Error ? cause.message : "No se pudo actualizar el rol.");
              setError(true);
            }
          });
        }}
      >
        {isPending ? "Actualizando…" : enabled ? "Quitar acceso de desarrollador" : "Habilitar como desarrollador"}
      </Button>
      <span aria-live="polite" className={`text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}>
        {message}
      </span>
    </div>
  );
}
