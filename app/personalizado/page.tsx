import Link from "next/link";
import { ArrowLeft, LogIn } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { CustomOrderForm } from "./CustomOrderForm";

export default async function PersonalizedOrderPage() {
  const session = await getSession();

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
      <section className="w-full max-w-2xl">
        <Button render={<Link href="/marketplace" />} nativeButton={false} variant="ghost" size="sm">
          <ArrowLeft className="size-4" />Marketplace
        </Button>
        <div className="mt-8 rounded-2xl border border-foreground/10 bg-card p-5 sm:p-9">
          <p className="font-heading text-[10px] uppercase tracking-[0.18em] text-accent-green">Proyecto a medida</p>
          <h1 className="mt-3 font-heading text-xl leading-relaxed tracking-tight sm:text-2xl">Contanos tu idea</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">Contanos sobre tú negocio, que queres conseguir, tiempos o limites que tengas y referencias, un profesional te responderá en menos de 24hrs horario UTC-3.</p>
          {session ? (
            <CustomOrderForm />
          ) : (
            <div className="mt-7 rounded-xl border border-accent-green/25 bg-accent-green/5 p-5">
              <p className="text-sm text-foreground/80">Iniciá sesión para enviar tu propuesta y seguir el pedido desde tu cuenta.</p>
              <Button render={<Link href="/login?next=%2Fpersonalizado" />} nativeButton={false} className="mt-4 font-heading text-[10px]">
                <LogIn className="size-4" />Iniciar sesión
              </Button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
