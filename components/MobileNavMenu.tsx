"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronRight, Code2, Minus, PanelsTopLeft, Plus, ShoppingBag, Workflow } from "lucide-react";
import { StaggeredMenuToggle } from "@/components/StaggeredMenu";

const serviceLinks = [
  { label: "Programación Web", slug: "programacion-web", Icon: Code2 },
  { label: "Automatización", slug: "automatizacion", Icon: Workflow },
  { label: "SaaS desde cero", slug: "saas-desde-cero", Icon: PanelsTopLeft },
  { label: "Tienda Online", slug: "tienda-online", Icon: ShoppingBag },
];

function MenuLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex min-h-[4.75rem] items-center justify-between border-b border-white/10 px-0 text-base font-medium text-white transition-colors hover:text-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      <span className="sm-panel-itemLabel inline-block [transform-origin:50%_100%] will-change-transform">{children}</span>
      <ChevronRight aria-hidden="true" className="size-4 text-white/70" />
    </Link>
  );
}

function ServicesMenu({ onNavigate, basePath }: { onNavigate: () => void; basePath: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls="mobile-service-links"
        onClick={() => setExpanded((value) => !value)}
        className="flex min-h-[4.75rem] w-full items-center justify-between px-0 text-left text-base font-medium text-white transition-colors hover:text-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <span className="sm-panel-itemLabel inline-block [transform-origin:50%_100%] will-change-transform">Servicios</span>
        {expanded ? <Minus aria-hidden="true" className="size-5 text-white/70" /> : <Plus aria-hidden="true" className="size-5 text-white/70" />}
      </button>
      {expanded && (
        <div id="mobile-service-links" className="grid gap-3 pb-4 pt-1" aria-label="Servicios disponibles">
          {serviceLinks.map(({ label, slug, Icon }) => (
            <a
              key={label}
              href={`${basePath}/${slug}`}
              onClick={onNavigate}
              className="group flex min-h-[5.25rem] items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-left text-white transition-colors hover:border-accent-green/40 hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green"
            >
              <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-accent-green/30 bg-accent-green/5 text-accent-green">
                <Icon className="size-4" strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="mt-1 block text-xs text-white/60">Descubrí opciones disponibles</span>
              </span>
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-white/50 transition-transform group-hover:translate-x-0.5 group-hover:text-accent-green" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function MobileNavMenu({ role }: { role?: string }) {
  const authenticated = Boolean(role);
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!open || !navRef.current) return;
    const items = navRef.current.querySelectorAll<HTMLElement>(".sm-panel-itemLabel");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(items, { clearProps: "all" });
      return;
    }
    gsap.fromTo(items,
      { yPercent: 140, rotate: 10 },
      { yPercent: 0, rotate: 0, duration: 0.8, ease: "power4.out", stagger: { each: 0.1, from: "start" }, clearProps: "transform" }
    );
    return () => {
      gsap.killTweensOf(items);
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="h-10 gap-3 rounded-none border-0 bg-transparent px-2 font-sans text-xs shadow-none hover:bg-transparent"
          />
        }
      >
        <span>Menú</span>
        <StaggeredMenuToggle open={open} />
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        showOverlay={false}
        className="mobile-nav-drawer inset-x-0 left-0 right-0 top-[72px] bottom-0 z-40 flex h-[calc(100dvh-72px)] w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-y-auto rounded-none border-0 bg-black p-6 text-white shadow-none ring-0 data-open:animate-none data-closed:animate-none md:hidden"
      >
        <nav ref={navRef} className="flex flex-col" aria-label="Navegación principal">
          {authenticated ? (
            <>
              <MenuLink href="/dashboard" onClick={() => setOpen(false)}>Mi panel</MenuLink>
              <MenuLink href="/portfolio" onClick={() => setOpen(false)}>Portfolio</MenuLink>
              <ServicesMenu onNavigate={() => setOpen(false)} basePath="/dashboard/marketplace" />
              <MenuLink href="/personalizado" onClick={() => setOpen(false)}>Personalizado</MenuLink>
              {role === "OWNER" && <MenuLink href="/admin/orders" onClick={() => setOpen(false)}>Administración</MenuLink>}
            </>
          ) : (
            <>
              <MenuLink href="/portfolio" onClick={() => setOpen(false)}>Portfolio</MenuLink>
              <ServicesMenu onNavigate={() => setOpen(false)} basePath="/marketplace" />
              <MenuLink href="/personalizado" onClick={() => setOpen(false)}>Personalizado</MenuLink>
            </>
          )}
        </nav>
        <div className="mt-auto flex flex-col gap-3 border-t border-white/10 pt-5">
          {authenticated ? (
            <form action={signOut}>
              <Button type="submit" variant="ghost" className="w-full justify-center text-white hover:bg-white/10 hover:text-white">
                Salir
              </Button>
            </form>
          ) : (
            <>
              <MenuLink href="/login" onClick={() => setOpen(false)}>Iniciar sesión</MenuLink>
              <Button
                render={<Link href="/register" onClick={() => setOpen(false)} />}
                nativeButton={false}
                className="h-14 w-full justify-center text-base font-semibold"
              >
                Crear cuenta
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
