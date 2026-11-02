"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { testCompleteAssignedOrder } from "@/app/actions/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

function isGitHubRepository(value: string) {
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    return url.protocol === "https:" && url.hostname === "github.com" && parts.length === 2 && !url.search && !url.hash;
  } catch {
    return false;
  }
}

function addHttpsIfMissing(value: string) {
  const trimmed = value.trim();
  return trimmed && !/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? `https://${trimmed}` : trimmed;
}

export function CompleteOrderForm({ orderId, showTestButton, initialRepositoryUrl, initialPreviewUrl, isRevision }: { orderId: string; showTestButton: boolean; initialRepositoryUrl: string; initialPreviewUrl: string; isRevision: boolean }) {
  const router = useRouter();
  const [repositoryUrl, setRepositoryUrl] = useState(initialRepositoryUrl);
  const [previewUrl, setPreviewUrl] = useState(initialPreviewUrl === "N/A" ? "" : initialPreviewUrl);
  const [previewUnavailable, setPreviewUnavailable] = useState(initialPreviewUrl === "N/A");
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [demoVideo, setDemoVideo] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [isCheckingVideo, setIsCheckingVideo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestPending, startTestTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const validRepository = isGitHubRepository(repositoryUrl.trim());

  function onScreenshotsChange(files: FileList | null) {
    setError(null);
    const selected = Array.from(files ?? []);
    if (selected.length < 1 || selected.length > 3) {
      setScreenshots([]);
      setError("Elegí entre 1 y 3 capturas.");
      return;
    }
    if (selected.some((file) => !file.type.startsWith("image/") || file.size > MAX_SCREENSHOT_SIZE)) {
      setScreenshots([]);
      setError("Cada captura debe ser una imagen de hasta 5 MB.");
      return;
    }
    setScreenshots(selected);
  }

  function onDemoVideoChange(file: File | undefined) {
    setError(null);
    setDemoVideo(null);
    setVideoDuration(null);
    if (!file) return;
    if (!["video/mp4", "video/webm"].includes(file.type) || file.size > MAX_VIDEO_SIZE) {
      setError("Elegí un video MP4 o WebM de hasta 50 MB.");
      return;
    }

    setIsCheckingVideo(true);
    const previewUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(previewUrl);
      setIsCheckingVideo(false);
      if (!Number.isFinite(duration) || duration < 20) {
        setError("La demo debe durar al menos 20 segundos.");
        return;
      }
      setDemoVideo(file);
      setVideoDuration(duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      setIsCheckingVideo(false);
      setError("No se pudo leer la duración del video.");
    };
    video.src = previewUrl;
  }

  async function submitCompletion() {
    setError(null);
    const body = new FormData();
    body.set("repositoryUrl", repositoryUrl.trim());
    body.set("previewUrl", previewUnavailable ? "N/A" : previewUrl.trim());
    screenshots.forEach((file) => body.append("screenshots", file, file.name));
    if (demoVideo) body.set("demoVideo", demoVideo, demoVideo.name);

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/completion`, { method: "POST", body });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "No se pudo completar el pedido.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo completar el pedido.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function submitTestCompletion() {
    setError(null);
    startTestTransition(async () => {
      try {
        await testCompleteAssignedOrder(orderId);
        router.refresh();
      } catch (testError) {
        setError(testError instanceof Error ? testError.message : "No se pudo completar la prueba.");
      }
    });
  }

  const canSubmit = validRepository && (previewUnavailable || Boolean(previewUrl.trim())) && screenshots.length >= 1 && screenshots.length <= 3 && !isCheckingVideo && !isSubmitting;
  const missingRequirements = [
    !validRepository ? "el enlace completo de GitHub (usuario/repositorio)" : "",
    !previewUnavailable && !previewUrl.trim() ? "un link de prueba o marcar N/A" : "",
    screenshots.length < 1 ? "entre 1 y 3 capturas" : "",
  ].filter(Boolean);

  return (
    <section className="border-t border-foreground/10 pt-7">
      <h2 className="text-lg font-semibold">{isRevision ? "Actualizar entrega" : "Entrega final"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {isRevision
          ? "Subí las capturas de esta versión. El enlace del repositorio se conserva, pero podés cambiarlo. La demo es opcional."
          : "Compartí el repositorio y capturas para que el cliente revise el pedido. La demo es opcional."}
      </p>

      <div className="mt-5 max-w-2xl space-y-5">
        <div className="space-y-2">
          <label htmlFor="completion-repository" className="text-sm font-medium">Repositorio de GitHub</label>
          <Input
            id="completion-repository"
            type="url"
            value={repositoryUrl}
            onChange={(event) => setRepositoryUrl(event.target.value)}
            onBlur={() => setRepositoryUrl((value) => addHttpsIfMissing(value))}
            placeholder="https://github.com/usuario/proyecto"
            autoComplete="url"
          />
          {repositoryUrl.trim() && !validRepository && (
            <p className="text-xs text-destructive">Pegá el enlace completo del repositorio, por ejemplo: https://github.com/usuario/proyecto.</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="completion-preview" className="text-sm font-medium">Link para probar la página</label>
          <Input id="completion-preview" type="url" value={previewUrl} onChange={(event) => setPreviewUrl(event.target.value)} onBlur={() => setPreviewUrl((value) => addHttpsIfMissing(value))} placeholder="https://sitio-demo.com" disabled={previewUnavailable} />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={previewUnavailable} onChange={(event) => setPreviewUnavailable(event.target.checked)} className="size-4 accent-accent-green" />
            N/A, no hay una página publicada para probar
          </label>
          <p className="text-xs text-muted-foreground">Es opcional. Si no agregás un enlace, marcá N/A.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="completion-screenshots" className="text-sm font-medium">Capturas de la web, 1 a 3 imágenes</label>
          <Input id="completion-screenshots" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => onScreenshotsChange(event.target.files)} />
          <p className="text-xs text-muted-foreground">Hasta 5 MB por imagen. {screenshots.length > 0 ? `${screenshots.length} seleccionadas.` : ""}</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="completion-demo" className="text-sm font-medium">Video mostrando la web (opcional)</label>
          <Input id="completion-demo" type="file" accept="video/mp4,video/webm" onChange={(event) => onDemoVideoChange(event.target.files?.[0])} />
          <p className="text-xs text-muted-foreground">Opcional: si la adjuntás, debe ser MP4 o WebM de al menos 20 segundos y hasta 50 MB. {isCheckingVideo ? "Verificando duración…" : videoDuration ? `Duración: ${Math.floor(videoDuration)} segundos.` : ""}</p>
        </div>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={submitCompletion} disabled={!canSubmit}>
            {isSubmitting ? "Subiendo entrega…" : isRevision ? "Actualizar y enviar a revisión" : "Enviar a revisión"}
          </Button>
          {showTestButton && (
            <Button type="button" variant="outline" onClick={submitTestCompletion} disabled={isTestPending || isSubmitting}>
              {isTestPending ? "Completando prueba…" : "Testpletado"}
            </Button>
          )}
        </div>
        {!canSubmit && !isSubmitting && missingRequirements.length > 0 && (
          <p className="text-xs text-muted-foreground">Para habilitar el envío, completá: {missingRequirements.join(", ")}.</p>
        )}
      </div>
    </section>
  );
}
