"use client";

import { usePathname } from "next/navigation";

export function AppShellRouteFrame({
  top,
  footer,
  children,
}: {
  top: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background">
      {!isDashboard && top}
      {children}
      {!isDashboard && footer}
    </div>
  );
}
