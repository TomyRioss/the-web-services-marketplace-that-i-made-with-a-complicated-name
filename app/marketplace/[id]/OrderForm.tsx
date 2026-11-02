"use client";

import { useRef, useState, useTransition } from "react";
import { CheckCircle2, ImagePlus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createOrder } from "@/app/actions/marketplace";
import { normalizeWebUrl } from "@/lib/normalize-web-url";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_REFERENCE_LINKS = 5;

export function OrderForm({ serviceId }: { serviceId: string }) {
  const [message, setMessage] = useState("");
  const [links, setLinks] = useState<string[]>([""]);
  const [files, setFiles] = useState<File[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setError(null);
    const selected = Array.from(fileList);
    const invalidType = selected.find((file) => !ALLOWED_TYPES.has(file.type));
    const tooLarge = selected.find((file) => file.size > MAX_FILE_SIZE);
    if (invalidType) setError("Usá imágenes JPG, PNG, WebP o GIF.");
    else if (tooLarge) setError(`${tooLarge.name} supera el límite de 50 MB.`);
    else if (files.length + selected.length > MAX_IMAGES) setError("Podés adjuntar hasta 5 imágenes.");
    else setFiles((current) => [...current, ...selected]);
    if (fileInput.current) fileInput.current.value = "";
  }

  function handleSubmit() {
    setError(null);
    const referenceLinks = links.map((link) => link.trim()).filter(Boolean);
    if (!message.trim()) {
      setError("Contanos qué necesitás para empezar.");
      return;
    }
    if (referenceLinks.length > MAX_REFERENCE_LINKS) {
      setError(`Podés agregar hasta ${MAX_REFERENCE_LINKS} enlaces.`);
      return;
    }
    let normalizedLinks: string[];
    try {
      normalizedLinks = referenceLinks.map(normalizeWebUrl);
    } catch {
      setError("Ingresá un dominio válido, como sitio.com, o una URL con http:// o https://.");
      return;
    }

    startTransition(async () => {
      try {
        let currentOrderId = orderId;
        if (!currentOrderId) {
          const order = await createOrder(serviceId, message, normalizedLinks);
          currentOrderId = order.id;
          setOrderId(currentOrderId);
        }

        for (const file of files) {
          const data = new FormData();
          data.append("image", file);
          const response = await fetch(`/api/orders/${currentOrderId}/attachments`, { method: "POST", body: data });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error ?? `No se pudo subir ${file.name}.`);
          setFiles((current) => current.filter((item) => item !== file));
        }
        setSent(true);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "No se pudo enviar el pedido.");
      }
    });
  }

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-center gap-2 rounded-lg bg-accent px-4 py-8 text-center">
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
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Contanos qué necesitás: rubro, referencias, plazos..."
        rows={5}
        maxLength={20000}
        aria-label="Detalles de tu pedido"
        className="min-h-32 resize-y"
      />

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">Enlaces de referencia</p>
        {links.map((link, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="url"
              value={link}
              onChange={(event) => setLinks((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
              placeholder="sitio.com o https://sitio.com"
              aria-label={`Enlace de referencia ${index + 1}`}
              className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isPending || Boolean(orderId)}
            />
            {links.length > 1 && !orderId && (
              <button type="button" aria-label={`Quitar enlace ${index + 1}`} onClick={() => setLinks((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-md p-2 text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            )}
          </div>
        ))}
        {links.length < MAX_REFERENCE_LINKS && !orderId && (
          <button type="button" onClick={() => setLinks((current) => [...current, ""])} className="inline-flex w-fit items-center gap-1 text-xs text-primary hover:underline">
            <Plus className="size-3.5" /> Agregar otro enlace
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">Imágenes de referencia, hasta 5</p>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => addFiles(event.target.files)} className="sr-only" aria-label="Elegir imágenes de referencia" />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={files.length >= MAX_IMAGES || isPending || Boolean(orderId)} className="h-8 shrink-0 px-2.5 text-xs">
            <ImagePlus className="size-3.5" /> {files.length}/{MAX_IMAGES}
          </Button>
        </div>
        {files.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {files.map((file, index) => (
              <li key={`${file.name}-${file.size}-${index}`} className="flex items-center gap-2 text-xs">
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <button type="button" aria-label={`Quitar ${file.name}`} onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={isPending} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"><X className="size-3.5" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button onClick={handleSubmit} disabled={isPending || (!message.trim() && !orderId)} className="w-full">
        {isPending ? "Enviando..." : orderId ? "Reintentar envío" : "Pedir este servicio"}
      </Button>
    </div>
  );
}
