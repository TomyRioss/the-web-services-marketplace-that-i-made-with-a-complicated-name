import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "404 | Devta",
  description: "No encontramos esta página. Volvé al inicio de Devta.",
};

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col bg-background px-6 py-6 text-foreground sm:px-10 sm:py-8 lg:px-16">
      <header className="mx-auto flex w-full max-w-7xl items-center">
        <Link href="/" aria-label="Devta, inicio" className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-green">
          <BrandLogo size="large" />
        </Link>
      </header>

      <section aria-labelledby="not-found-title" className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-7 py-16 sm:gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
        <p aria-hidden="true" className="select-none text-center font-heading text-[clamp(7rem,34vw,11rem)] leading-[0.85] tracking-[-0.1em] sm:text-[clamp(9rem,25vw,15rem)] lg:text-left lg:text-[clamp(10rem,18vw,18rem)]">
          <span>4</span><span className="text-accent-green">0</span><span>4</span>
        </p>

        <div className="max-w-xl lg:justify-self-end">
          <h1 id="not-found-title" className="text-balance text-center text-3xl font-medium leading-tight tracking-[-0.035em] sm:text-4xl lg:text-left lg:text-5xl">
            No encontramos esta página.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-center text-base leading-7 text-foreground/65 sm:text-lg sm:leading-8 lg:mx-0 lg:text-left">
            La dirección puede estar mal escrita o ya no estar disponible.
          </p>
          <div className="mt-8 flex justify-center lg:justify-start">
            <Button
              render={<Link href="/" />}
              nativeButton={false}
              className="min-h-12 rounded-lg bg-accent-green px-6 font-sans text-xs text-black transition-colors hover:bg-accent-green/85 focus-visible:ring-accent-green motion-reduce:transition-none"
            >
              Volver al inicio
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
