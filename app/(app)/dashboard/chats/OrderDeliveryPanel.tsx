"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendOrderDeliveryByEmail, sendOrderDeliveryToChat } from "@/app/actions/order-delivery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type OrderDeliveryPanelProps = {
  orderId: string;
  role: string;
  clientEmail: string;
  repositoryUrl: string;
  screenshots: { name: string; href: string }[];
  demoVideoHref: string | null;
  fullyPaid: boolean;
  chatDeliveredAt: string | null;
  emailDeliveredAt: string | null;
  deliveryEmail: string | null;
};

export function OrderDeliveryPanel(props: OrderDeliveryPanelProps) {
  const router = useRouter();
  const [alternate, setAlternate] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isPending, startTransition] = useTransition();
  if (props.role !== "ADMIN" && props.role !== "OWNER") return null;

  function send(channel: "chat" | "email") {
    setError("");
    setNotice("");
    startTransition(async () => {
      try {
        if (channel === "chat") await sendOrderDeliveryToChat(props.orderId);
        else await sendOrderDeliveryByEmail(props.orderId, alternate ? email : undefined);
        setNotice(channel === "chat" ? "Materiales enviados al chat del cliente." : "Materiales enviados por email.");
        router.refresh();
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "No se pudo completar la entrega.");
      }
    });
  }

  return (
    <section aria-labelledby="order-delivery-heading" className="border-b py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="order-delivery-heading" className="font-heading text-xs leading-6">Entrega de materiales</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {props.fullyPaid ? "Saldo confirmado. Elegí cómo enviar la entrega." : "Se habilita cuando se confirme el pago del saldo."}
          </p>
        </div>
        {!props.fullyPaid && <span className="text-xs text-muted-foreground">Pago pendiente</span>}
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        <li><a className="text-accent-green underline underline-offset-4" href={props.repositoryUrl} target="_blank" rel="noreferrer">Repositorio de GitHub</a></li>
        {props.screenshots.map((image, index) => <li key={image.name}><a className="text-accent-green underline underline-offset-4" href={image.href} target="_blank" rel="noreferrer">Captura {index + 1}</a></li>)}
        {props.demoVideoHref && <li><a className="text-accent-green underline underline-offset-4" href={props.demoVideoHref} target="_blank" rel="noreferrer">Video demo</a></li>}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" disabled={!props.fullyPaid || Boolean(props.chatDeliveredAt) || isPending} onClick={() => send("chat")} className="min-h-10 font-heading text-xs">
          {props.chatDeliveredAt ? "Enviado al chat" : isPending ? "Enviando…" : "Enviar al chat"}
        </Button>
        <Button type="button" variant="outline" disabled={!props.fullyPaid || Boolean(props.emailDeliveredAt) || isPending} onClick={() => send("email")} className="min-h-10 font-heading text-xs">
          {props.emailDeliveredAt ? "Enviado por email" : "Enviar por email"}
        </Button>
      </div>
      {!props.emailDeliveredAt && <div className="mt-3 space-y-2">
        <p className="text-xs text-muted-foreground">Destino: {props.clientEmail || "El cliente no tiene email registrado"}</p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={alternate} onChange={(event) => setAlternate(event.target.checked)} className="size-4 accent-accent-green" />
          Enviar a otro correo
        </label>
        {alternate && <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="correo@ejemplo.com" aria-label="Correo alternativo de entrega" className="h-10 max-w-md" />}
      </div>}
      {props.emailDeliveredAt && <p className="mt-2 text-xs text-muted-foreground">Enviado a {props.deliveryEmail || props.clientEmail || "el correo registrado"}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-accent-green">{notice}</p>}
    </section>
  );
}
