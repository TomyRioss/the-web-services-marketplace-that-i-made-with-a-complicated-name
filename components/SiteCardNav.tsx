"use client";

import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { BrandLogo } from "@/components/BrandLogo";
import CardNav, { type CardNavItem } from "@/components/CardNav";

export function SiteCardNav({ role }: { role?: string }) {
  const authenticated = Boolean(role);
  const marketplaceHref = authenticated ? "/dashboard/marketplace" : "/marketplace";
  const items: CardNavItem[] = authenticated
    ? [
        {
          label: "Portfolio",
          description: "Explorá proyectos realizados y sus detalles.",
          links: [{ label: "Ver proyectos", href: "/portfolio" }],
        },
        {
          label: "Servicios",
          description: "Encontrá el servicio que necesita tu proyecto.",
          links: [{ label: "Explorar servicios", href: marketplaceHref }],
        },
        {
          label: "Personalizado",
          description: "Contanos sobre el proyecto que tenés en mente.",
          links: [{ label: "Pedir una propuesta", href: "/personalizado" }],
        },
        {
          label: "Mi cuenta",
          description: "Accedé a tu espacio de trabajo.",
          links: [{ label: "Mi panel", href: "/dashboard" }],
        },
        ...(role === "OWNER"
          ? [
              {
                label: "Administración",
                description: "Gestioná pedidos y servicios.",
                links: [{ label: "Abrir administración", href: "/admin/orders" }],
              },
            ]
          : []),
      ]
    : [
        {
          label: "Portfolio",
          description: "Conocé proyectos realizados por el equipo.",
          links: [{ label: "Ver proyectos", href: "/portfolio" }],
        },
        {
          label: "Servicios",
          description: "Conocé las soluciones disponibles para tu proyecto.",
          links: [{ label: "Explorar servicios", href: marketplaceHref }],
        },
        {
          label: "Personalizado",
          description: "Contanos sobre el proyecto que tenés en mente.",
          links: [{ label: "Pedir una propuesta", href: "/personalizado" }],
        },
        {
          label: "Cuenta",
          description: "Ingresá o creá una cuenta para continuar.",
          links: [
            { label: "Iniciar sesión", href: "/login" },
            { label: "Crear cuenta", href: "/register" },
          ],
        },
      ];

  return (
    <CardNav
      ariaLabel="Navegación principal"
      logo={<BrandLogo inverse />}
      logoAlt="Devta"
      logoHref={authenticated ? "/dashboard" : "/marketplace"}
      items={items}
      cta={
        authenticated
          ? { label: "Salir", onClick: () => void signOut() }
          : { label: "Comenzá sin costo", href: "/register" }
      }
      secondaryCta={!authenticated ? { label: "Iniciar sesión", href: "/login" } : undefined}
      theme="dark"
      surface="glass"
      accentColor="#C9E94F"
      maxWidth={1200}
      cardHeight={168}
      linkComponent={Link}
      className="hidden md:block"
    />
  );
}
