"use client";

import { usePathname } from "next/navigation";
import { DashboardPillNav } from "@/components/DashboardPillNav";

export function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const items = [
    ...(role === "OWNER" ? [{ href: "/admin/users", label: "Usuarios", active: pathname.startsWith("/admin/users") }] : []),
    ...(role === "OWNER" || role === "ADMIN"
      ? [{ href: "/admin/orders", label: "Pedidos", active: pathname.startsWith("/admin/orders") }]
      : []),
    ...(role === "OWNER" || role === "ADMIN"
      ? [{ href: "/admin/dashboard-ads", label: "Dashboard Ads", active: pathname.startsWith("/admin/dashboard-ads") }]
      : []),
    ...(role === "OWNER" ? [{ href: "/admin/services", label: "Servicios", active: pathname.startsWith("/admin/services") }] : []),
    ...(["OWNER", "ADMIN", "DEV"].includes(role)
      ? [{ href: "/admin/chats", label: "Chats", active: pathname.startsWith("/admin/chats") }]
      : []),
  ];

  return <DashboardPillNav title="Administración" items={items} role={role} />;
}
