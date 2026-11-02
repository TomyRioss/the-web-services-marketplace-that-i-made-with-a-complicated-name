"use client";

import Image from "next/image";
import { useActionState } from "react";
import { saveDashboardAd, type DashboardAd, type DashboardAdFormState } from "@/app/actions/dashboard-ads";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: DashboardAdFormState = { error: null, saved: false };

export function DashboardAdForm({ ad }: { ad: DashboardAd }) {
  const [state, formAction, pending] = useActionState(saveDashboardAd, initialState);

  return (
    <form action={formAction} className="h-full">
      <Card>
        <CardHeader>
          <CardTitle>{ad.title}</CardTitle>
          <CardDescription>Se muestra sobre “Pedidos activos” en el dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex flex-col gap-5">
            <input type="hidden" name="slot" value={ad.slot} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dashboard-ad-image">Imagen</Label>
              <Input
                id="dashboard-ad-image"
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                required={!ad.id}
                className="h-auto min-h-10 py-2 file:mr-3 file:rounded-md file:border-0 file:bg-accent-green file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-black"
              />
              <p className="text-xs text-muted-foreground">JPG, PNG, WebP o GIF, hasta 5 MB. Dejalo vacío para conservar la imagen actual.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dashboard-ad-href">Enlace de destino</Label>
              <Input
                id="dashboard-ad-href"
                name="href"
                type="text"
                required
                maxLength={2048}
                defaultValue={ad.href}
                placeholder="/dashboard/marketplace/programacion-web"
              />
            </div>

            <label className="flex w-fit cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="active"
                defaultChecked={ad.active}
                className="size-4 accent-[#C9E94F]"
              />
              Mostrar anuncio en el dashboard
            </label>

            {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
            {state.saved && <p role="status" className="text-sm text-accent-green">Anuncio guardado.</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Vista previa</Label>
            <div className="flex min-h-40 items-center justify-center overflow-hidden rounded-xl border border-foreground/10 bg-background p-3">
              <Image
                src={ad.imageUrl}
                alt={`Vista previa de ${ad.title}`}
                width={1536}
                height={1024}
                unoptimized
                className="h-auto max-h-56 w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Guardar anuncio"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
