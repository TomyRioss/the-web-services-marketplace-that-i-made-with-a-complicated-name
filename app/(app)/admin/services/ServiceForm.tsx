"use client";

import { useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createService, updateService, type ServiceReference } from "@/app/actions/marketplace";
import { inferServiceCategory, SERVICE_CATEGORIES } from "@/lib/service-categories";
import type { Service } from "@/lib/data-types";

export function ServiceForm({ service }: { service?: Service }) {
  const isEdit = !!service;
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(service?.title ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [priceArs, setPriceArs] = useState(String(service?.priceArs ?? ""));
  const [priceUsd, setPriceUsd] = useState(String(service?.priceUsd ?? ""));
  const [deliveryDays, setDeliveryDays] = useState(String(service?.deliveryDays ?? ""));
  const [category, setCategory] = useState(service?.category || inferServiceCategory(service?.title, service?.description));
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>(
    (service?.portfolioUrls as string[] | undefined) ?? []
  );
  const [references, setReferences] = useState<ServiceReference[]>(
    (service?.references as ServiceReference[] | undefined) ?? []
  );
  const [newRefUrl, setNewRefUrl] = useState("");
  const [active, setActive] = useState(service?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingRefImage, setIsUploadingRefImage] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refImageInputRef = useRef<HTMLInputElement>(null);
  const pendingRefImageIndex = useRef<number | null>(null);

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setIsUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "No se pudo subir la imagen.");
        uploaded.push(json.url);
      }
      setPortfolioUrls((prev) => [...prev, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la imagen.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(url: string) {
    setPortfolioUrls((prev) => prev.filter((u) => u !== url));
  }

  function addReference() {
    const url = newRefUrl.trim();
    if (!url) return;
    setReferences((prev) => [...prev, { url }]);
    setNewRefUrl("");
  }

  function removeReference(index: number) {
    setReferences((prev) => prev.filter((_, i) => i !== index));
  }

  function pickReferenceImage(index: number) {
    pendingRefImageIndex.current = index;
    refImageInputRef.current?.click();
  }

  async function handleReferenceImageSelected(files: FileList | null) {
    const index = pendingRefImageIndex.current;
    const file = files?.[0];
    if (!file || index === null) return;
    setError(null);
    setIsUploadingRefImage(index);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo subir la imagen.");
      setReferences((prev) =>
        prev.map((r, i) => (i === index ? { ...r, imageUrl: json.url } : r))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la imagen.");
    } finally {
      setIsUploadingRefImage(null);
      pendingRefImageIndex.current = null;
      if (refImageInputRef.current) refImageInputRef.current.value = "";
    }
  }

  function removeReferenceImage(index: number) {
    setReferences((prev) => prev.map((r, i) => (i === index ? { url: r.url } : r)));
  }

  function handleSubmit() {
    setError(null);
    const data = {
      title,
      description,
      priceArs: Number(priceArs),
      priceUsd: Number(priceUsd),
      deliveryDays: Number(deliveryDays),
      category,
      portfolioUrls,
      references,
    };

    startTransition(async () => {
      try {
        if (isEdit) {
          await updateService(service.id, { ...data, active });
        } else {
          await createService(data);
        }
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={isEdit ? "outline" : "default"} size={isEdit ? "sm" : "default"} />}>
        {isEdit ? "Editar" : "Nuevo servicio"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Landing Page" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Qué incluye el servicio"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="service-category">Categoría</Label>
            <select id="service-category" value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              {SERVICE_CATEGORIES.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Precio ARS</Label>
              <Input
                type="number"
                value={priceArs}
                onChange={(e) => setPriceArs(e.target.value)}
                placeholder="150000"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Precio USD</Label>
              <Input
                type="number"
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Días hábiles</Label>
              <Input
                type="number"
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value)}
                placeholder="5"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Imágenes de portfolio</Label>
            {portfolioUrls.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {portfolioUrls.map((url) => (
                  <div key={url} className="group relative aspect-square overflow-hidden rounded-md ring-1 ring-foreground/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="text-sm"
              disabled={isUploading}
            />
            {isUploading && <p className="text-xs text-muted-foreground">Subiendo...</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Links de referencia</Label>
            <input
              ref={refImageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleReferenceImageSelected(e.target.files)}
              className="hidden"
            />
            {references.length > 0 && (
              <div className="flex flex-col gap-2">
                {references.map((ref, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md border p-2">
                    {ref.imageUrl ? (
                      <div className="group relative size-10 shrink-0 overflow-hidden rounded ring-1 ring-foreground/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ref.imageUrl} alt="" className="size-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeReferenceImage(i)}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="size-3.5 text-white" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => pickReferenceImage(i)}
                        disabled={isUploadingRefImage === i}
                        className="flex size-10 shrink-0 items-center justify-center rounded border border-dashed text-[10px] text-muted-foreground hover:border-foreground/40 hover:text-foreground disabled:opacity-50"
                      >
                        {isUploadingRefImage === i ? "..." : "+ img"}
                      </button>
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm">{ref.url}</span>
                    <button
                      type="button"
                      onClick={() => removeReference(i)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={newRefUrl}
                onChange={(e) => setNewRefUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addReference();
                  }
                }}
                placeholder="https://ejemplo.com"
              />
              <Button type="button" variant="outline" onClick={addReference}>
                Agregar
              </Button>
            </div>
          </div>

          {isEdit && (
            <div className="flex items-center justify-between">
              <Label>Activo (visible en el marketplace)</Label>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !title.trim() || !description.trim()}
          >
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
