"use client";

import { useRef, useState } from "react";
import { CheckCircle2, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function CustomOrderForm() {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setError(null);
    const selected = Array.from(fileList);
    const invalidType = selected.find((file) => !ALLOWED_TYPES.has(file.type));
    if (invalidType) {
      setError("Usá imágenes JPG, PNG, WebP o GIF.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    const tooLarge = selected.find((file) => file.size > MAX_FILE_SIZE);
    if (tooLarge) {
      setError(`${tooLarge.name} supera el límite de 50 MB.`);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    if (files.length + selected.length > MAX_IMAGES) {
      setError("Podés adjuntar hasta 5 imágenes.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setFiles((current) => [...current, ...selected]);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function submit() {
    setError(null);
    setSending(true);
    try {
      let currentOrderId = orderId;
      if (!currentOrderId) {
        const response = await fetch("/api/orders/custom", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "No se pudo enviar el pedido.");
        currentOrderId = result.orderId;
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
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div role="status" className="mt-7 rounded-xl border border-accent-green/30 bg-accent-green/5 px-5 py-8 text-center">
        <CheckCircle2 className="mx-auto size-7 text-accent-green" />
        <h2 className="mt-3 font-heading text-sm">Pedido enviado</h2>
        <p className="mt-2 text-sm text-muted-foreground">Ya está en pedidos. Un profesional te responderá dentro de las próximas 24 horas.</p>
      </div>
    );
  }

  return (
    <div className="mt-7 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="custom-message" className="text-sm font-semibold">¿Qué tenes en mente?</label>
        <Textarea id="custom-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={20000} rows={6} placeholder="Tu negocio, objetivos, plazos, límites o referencias..." className="resize-y leading-relaxed" required />
        <span className="self-end text-xs text-muted-foreground">{message.length}/20.000</span>
      </div>

      <div className="flex flex-col gap-2">
        <div>
          <p className="text-sm font-semibold">Imágenes de referencia</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Hasta 5 imágenes, máximo 50 MB cada una.</p>
        </div>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => addFiles(event.target.files)} className="sr-only" aria-label="Elegir imágenes de referencia" />
        <div className="rounded-xl border border-dashed border-foreground/20 bg-background/40 p-4">
          <Button type="button" variant="outline" onClick={() => fileInput.current?.click()} disabled={files.length >= MAX_IMAGES || sending} className="w-full border-foreground/15 sm:w-auto">
            <ImagePlus className="size-4" />Agregar imágenes ({files.length}/{MAX_IMAGES})
          </Button>
          {files.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2">
              {files.map((file, index) => (
                <li key={`${file.name}-${file.size}-${index}`} className="flex items-center gap-3 rounded-lg border border-foreground/10 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                  <button type="button" aria-label={`Quitar ${file.name}`} onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={sending} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"><X className="size-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button onClick={submit} disabled={sending || !message.trim()} className="min-h-12 font-heading text-[10px]">
        {sending ? "Enviando pedido..." : orderId ? "Reintentar imágenes" : "Enviar pedido"}
      </Button>
    </div>
  );
}
