"use client";

import { useState, useTransition } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { assignOrderToDeveloper } from "@/app/actions/marketplace";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Developer = { id: string; name: string; email: string };

export function OrderAssigneeSelect({
  orderId,
  assignedDevId,
  developers,
}: {
  orderId: string;
  assignedDevId: string;
  developers: Developer[];
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  return (
    <div className="min-w-44">
      <Select
        value={assignedDevId || ""}
        disabled={isPending || developers.length === 0}
        onValueChange={(developerId) => {
          if (!developerId) return;
          setMessage(null);
          setError(false);
          startTransition(async () => {
            try {
              const result = await assignOrderToDeveloper(orderId, developerId);
              setMessage(
                result.unchanged
                  ? "Ya estaba asignado"
                  : result.emailSent
                    ? "Asignado y notificado"
                    : `Asignado, correo no enviado: ${result.emailError ?? "revisá la configuración de Resend"}`
              );
              setError(!result.emailSent && !result.unchanged);
            } catch (cause) {
              setMessage(cause instanceof Error ? cause.message : "No se pudo asignar.");
              setError(true);
            }
          });
        }}
      >
        <SelectTrigger size="sm" aria-label="Asignar desarrollador">
          <SelectValue placeholder={developers.length ? "Sin asignar" : "No hay developers"}>
            {(value: string) => developers.find((developer) => developer.id === value)?.name ?? "Sin asignar"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {developers.map((developer) => (
            <SelectItem key={developer.id} value={developer.id}>
              {developer.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p aria-live="polite" className={`mt-1 min-h-4 text-[11px] ${error ? "text-destructive" : "text-muted-foreground"}`}>
        {isPending ? <LoaderCircle className="inline size-3 animate-spin" /> : message ? (
          <>{!error && <Check className="mr-1 inline size-3" />}{message}</>
        ) : developers.find((developer) => developer.id === assignedDevId)?.email}
      </p>
    </div>
  );
}
