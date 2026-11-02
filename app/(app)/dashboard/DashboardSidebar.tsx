"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { DashboardPillNav } from "@/components/DashboardPillNav";
import type { DashboardNotification } from "@/lib/notification-types";

export function DashboardSidebar({
  role,
  fullName,
  email,
  notifications,
  unreadNotifications,
}: {
  role: string;
  fullName: string;
  email: string;
  notifications: DashboardNotification[];
  unreadNotifications: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "";
  const items = [
    { href: "/dashboard", label: "Resumen", active: pathname === "/dashboard" },
    ...(role !== "DEV"
      ? [{ href: "/dashboard/servicios", label: "Servicios", active: pathname.startsWith("/dashboard/servicios") }]
      : []),
    {
      href: "/dashboard/orders?tab=progreso",
      label: "En progreso",
      active: pathname === "/dashboard/orders" && (tab === "" || tab === "progreso"),
    },
    {
      href: "/dashboard/orders?tab=hechos",
      label: "Hechos",
      active: pathname === "/dashboard/orders" && tab === "hechos",
    },
    ...(role !== "DEV" ? [{ href: "/dashboard/chats", label: "Chats", active: pathname.startsWith("/dashboard/chats") }] : []),
    ...(["OWNER", "ADMIN", "DEV"].includes(role)
      ? [{ href: "/dashboard/staff", label: "Staff", active: pathname.startsWith("/dashboard/staff") }]
      : []),
    ...(["OWNER", "ADMIN", "DEV"].includes(role)
      ? [{ href: role === "DEV" ? "/admin/chats" : "/admin/orders", label: "Administración", active: pathname.startsWith("/admin") }]
      : []),
  ];

  const adminItems = [
    { href: "/admin/users", label: "Usuarios", active: pathname.startsWith("/admin/users") },
    { href: "/admin/orders", label: "Pedidos", active: pathname.startsWith("/admin/orders") },
    { href: "/admin/dashboard-ads", label: "Dashboard Ads", active: pathname.startsWith("/admin/dashboard-ads") },
    { href: "/admin/services", label: "Servicios", active: pathname.startsWith("/admin/services") },
    { href: "/admin/chats", label: "Chats", active: pathname.startsWith("/admin/chats") },
  ];
  const adminRightItems = [{ href: "/dashboard/staff", label: "Pedidos del equipo", active: pathname.startsWith("/dashboard/staff") }];
  const developerItems = [
    { href: "/dashboard/staff", label: "Pedidos asignados", active: pathname.startsWith("/dashboard/staff") },
  ];
  const visibleItems = role === "OWNER" || role === "ADMIN" ? adminItems : role === "DEV" ? developerItems : items;

  return <DashboardPillNav title="Navegación del panel" items={visibleItems} rightItems={role === "OWNER" || role === "ADMIN" ? adminRightItems : []} marketplace={role === "CLIENTE"} user={{ fullName, email }} role={role} notifications={notifications} unreadNotifications={unreadNotifications} />;
}
