"use client";

import { useState, useTransition } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { assignOrderToDeveloper } from "@/app/actions/marketplace";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Developer = { id: string; name: string; email: string; isCurrentUser: boolean };

export function OrderAssigneeSelect({
  orderId,
  assignedDevId,
  initialAssignmentNote,
  developers,
}: {
  orderId: string;
  assignedDevId: string;
  initialAssignmentNote?: string;
  developers: Developer[];
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [selectedDeveloperId, setSelectedDeveloperId] = useState(assignedDevId || "");
  const [assignmentNote, setAssignmentNote] = useState(initialAssignmentNote ?? "");

  function saveAssignment() {
    if (!selectedDeveloperId) return;
    setMessage(null);
    setError(false);
    startTransition(async () => {
      try {
        const result = await assignOrderToDeveloper(orderId, selectedDeveloperId, assignmentNote);
        if (!result.unchanged && result.clientNotificationEmailError) {
          setMessage(`Asignado, aviso guardado; correo al cliente pendiente: ${result.clientNotificationEmailError}`);
          setError(true);
          return;
        }
        setMessage(result.unchanged ? "Asignación guardada" : result.emailSent ? "Asignado y notificado" : `Asignado, correo no enviado: ${result.emailError ?? "revisá la configuración de Resend"}`);
        setError(!result.emailSent && !result.unchanged);
      } catch (cause) {
        setMessage(cause instanceof Error ? cause.message : "No se pudo asignar.");
        setError(true);
      }
    });
  }

  return (
    <div className="w-52 min-w-44">
      <Select
        value={selectedDeveloperId}
        disabled={isPending || developers.length === 0}
        onValueChange={(developerId) => { if (developerId) { setSelectedDeveloperId(developerId); setMessage(null); } }}
      >
        <SelectTrigger size="sm" aria-label="Asignar desarrollador" className="h-9 w-full rounded-xl border-border/80 bg-background/60 px-3 shadow-sm transition hover:border-accent-green/50 hover:bg-muted/60 focus-visible:border-accent-green focus-visible:ring-accent-green/20">
          <SelectValue className="min-w-0" placeholder={developers.length ? "Sin asignar" : "Sin usuarios"}>
            {(value: string) => {
              const selected = developers.find((developer) => developer.id === value);
              return selected ? (
                <span className="block min-w-0 truncate" title={selected.name}>
                  {selected.name}{selected.isCurrentUser ? " (vos)" : ""}
                </span>
              ) : "Sin asignar";
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start" className="min-w-56 rounded-xl border border-border/80 p-1.5 shadow-xl">
          {developers.map((developer) => (
            <SelectItem key={developer.id} value={developer.id} className="min-h-9 rounded-lg px-2.5">
              <span className="min-w-0 truncate" title={developer.name}>{developer.name}</span>
              {developer.isCurrentUser && <span className="text-xs font-medium text-accent-green">Vos</span>}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <details className="mt-2 rounded-lg border border-border/70 px-2.5 py-2">
        <summary className="cursor-pointer text-xs font-medium text-foreground/80">Nota para el desarrollador{initialAssignmentNote ? " · tiene una nota" : " · opcional"}</summary>
        <label className="sr-only" htmlFor={`assignment-note-${orderId}`}>Nota para el desarrollador</label>
        <Textarea
          id={`assignment-note-${orderId}`}
          value={assignmentNote}
          onChange={(event) => setAssignmentNote(event.target.value)}
          maxLength={4000}
          rows={2}
          placeholder="Contexto o indicaciones para el pedido"
          className="mt-2 min-h-16 resize-y text-xs"
        />
      </details>
      <Button className="mt-2 w-full" size="sm" disabled={isPending || !selectedDeveloperId} onClick={saveAssignment}>
        {isPending ? <LoaderCircle className="size-3.5 animate-spin" /> : null}
        Guardar asignación
      </Button>
      <p aria-live="polite" className={`mt-1 min-h-4 text-[11px] ${error ? "text-destructive" : "text-muted-foreground"}`}>
        {isPending ? <LoaderCircle className="inline size-3 animate-spin" /> : message ? (
          <>{!error && <Check className="mr-1 inline size-3" />}{message}</>
        ) : developers.find((developer) => developer.id === assignedDevId)?.email}
      </p>
    </div>
  );
}
