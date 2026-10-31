"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ClipboardList, Wrench, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const links: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/orders", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/services", label: "Servicios", icon: Wrench },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r bg-card px-3 py-4 md:flex">
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Administración
      </p>
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
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
    </aside>
  );
}
