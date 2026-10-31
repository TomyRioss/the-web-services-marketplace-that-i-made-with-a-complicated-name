"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createOrder } from "@/app/actions/marketplace";

export function OrderForm({ serviceId }: { serviceId: string }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await createOrder(serviceId, message);
        setSent(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo enviar el pedido.");
      }
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg bg-accent px-4 py-8 text-center">
        <CheckCircle2 className="size-6 text-primary" />
        <p className="text-sm font-medium">Pedido enviado</p>
        <p className="text-sm text-muted-foreground">Te vamos a contactar por email.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Contanos qué necesitás: rubro, referencias, plazos..."
        rows={4}
        aria-label="Detalles de tu pedido"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handleSubmit} disabled={isPending || !message.trim()} className="w-full">
        {isPending ? "Enviando..." : "Pedir este servicio"}
      </Button>
    </div>
  );
}
