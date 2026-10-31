"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ClipboardList,
  Clock,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type LinkDef = { href: string; label: string; icon: LucideIcon; match: (pathname: string, tab: string) => boolean };

const links: LinkDef[] = [
  {
    href: "/dashboard",
    label: "Resumen",
    icon: LayoutDashboard,
    match: (pathname) => pathname === "/dashboard",
  },
  {
    href: "/dashboard/servicios",
    label: "Servicios",
    icon: Wrench,
    match: (pathname) => pathname.startsWith("/dashboard/servicios"),
  },
  {
    href: "/dashboard/orders?tab=progreso",
    label: "Pedidos en progreso",
    icon: Clock,
    match: (pathname, tab) => pathname === "/dashboard/orders" && (tab === "" || tab === "progreso"),
  },
  {
    href: "/dashboard/orders?tab=hechos",
    label: "Pedidos hechos",
    icon: CheckCircle2,
    match: (pathname, tab) => pathname === "/dashboard/orders" && tab === "hechos",
  },
  {
    href: "/dashboard/chats",
    label: "Chats",
    icon: MessageSquare,
    match: (pathname) => pathname.startsWith("/dashboard/chats"),
  },
];

export function DashboardSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "";

  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r bg-card px-3 py-4 md:flex">
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Mi panel
      </p>
      {links.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname, tab);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground/80 hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "size-4.5 shrink-0",
                active ? "text-primary-foreground" : "text-muted-foreground"
              )}
            />
            {label}
          </Link>
        );
      })}

      {role === "OWNER" && (
        <Link
          href="/admin/orders"
          className={cn(
            "mt-4 flex items-center gap-3 rounded-lg border border-primary/20 px-3 py-2.5 text-sm font-medium",
            "text-primary transition-colors hover:bg-primary/10"
          )}
        >
          <ShieldCheck className="size-4.5 shrink-0" />
          Administración
        </Link>
      )}

      <div className="mt-auto px-3 pt-6">
        <Link
          href="/marketplace"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
        >
          <ClipboardList className="size-4.5 shrink-0 text-muted-foreground" />
          Ver marketplace
        </Link>
      </div>
    </aside>
  );
}
