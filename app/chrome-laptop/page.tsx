import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { ChromeLaptopViewer } from "@/components/chrome-laptop/ChromeLaptopViewer";

export const metadata: Metadata = {
  title: "Devta",
  description: "Explorá en 3D una laptop abierta, esculpida en cromo líquido.",
};

export default function ChromeLaptopPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 pb-7 pt-5 sm:px-9 sm:pt-7 lg:px-14">
        <header className="flex items-center justify-between">
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-4"
            href="/marketplace"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Volver al catálogo
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-foreground/60">
            <Sparkles aria-hidden="true" className="size-4 text-orange-600" />
            Devta
          </div>
        </header>

        <div className="mx-auto my-auto w-full max-w-6xl py-12 sm:py-16">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:mb-10 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">
                Objeto imposible · edición 001
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-6xl">
                Cromo líquido.
                <span className="block text-foreground/55">Forma de laptop.</span>
              </h1>
            </div>
            <p className="max-w-[18rem] text-sm leading-6 text-foreground/70 sm:pb-1">
              Cromo de espejo, sin gotas y con la pantalla más abierta. Girala para ver el brillo desde todos los ángulos.
            </p>
          </div>

          <ChromeLaptopViewer />

          <div className="mt-7 flex flex-wrap gap-x-7 gap-y-2 border-t border-border pt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/60">
            <span>Platinum mirror</span>
            <span>Superficie pulida</span>
            <span>Giro libre de 360°</span>
          </div>
        </div>

        <footer className="flex items-center justify-between border-t border-border pt-4 text-xs text-foreground/60">
          <span>Devta</span>
          <span>Estudio de materiales</span>
        </footer>
      </div>
    </main>
  );
}
