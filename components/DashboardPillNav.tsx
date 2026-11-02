"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ClipboardList, Headset, LogOut, MessageCircle, Shield, Star, Store } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { BrandLogo } from "@/components/BrandLogo";
import SpecularButton from "@/components/SpecularButton";
import { NotificationBell } from "@/components/NotificationBell";
import type { DashboardNotification } from "@/lib/notification-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type DashboardNavItem = {
  href: string;
  label: string;
  active: boolean;
};

const roleLabels: Record<string, string> = {
  CLIENTE: "Cliente",
  DEV: "Desarrollador",
  ADMIN: "Administrador",
  OWNER: "Propietario",
};

export function DashboardPillNav({
  title,
  items,
  rightItems = [],
  marketplace = false,
  user,
  role,
  notifications = [],
  unreadNotifications = 0,
}: {
  title: string;
  items: DashboardNavItem[];
  rightItems?: DashboardNavItem[];
  marketplace?: boolean;
  user?: { fullName: string; email: string };
  role?: string;
  notifications?: DashboardNotification[];
  unreadNotifications?: number;
}) {
  const pillRef = useRef<HTMLDivElement>(null);
  const [spacerHeight, setSpacerHeight] = useState(134);

  useEffect(() => {
    const pill = pillRef.current;
    if (!pill) return;

    const updateSpacer = () => {
      const verticalSpace = window.matchMedia("(min-width: 768px)").matches ? 68 : 60;
      setSpacerHeight(Math.ceil(pill.getBoundingClientRect().height + verticalSpace));
    };

    const observer = new ResizeObserver(updateSpacer);
    observer.observe(pill);
    updateSpacer();
    return () => observer.disconnect();
  }, []);

  const renderNavItem = ({ href, label, active }: DashboardNavItem) => (
    <li key={href} className="shrink-0">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`group relative flex min-h-10 cursor-pointer items-center overflow-hidden rounded-full px-3 text-xs font-medium outline-none transition-colors duration-200 hover:text-black focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 focus-visible:ring-offset-[#171717] ${marketplace ? "md:px-2" : "md:px-4"} md:text-sm ${active ? "text-black" : "text-white"}`}
      >
        <span
          aria-hidden="true"
          className={`absolute inset-0 origin-bottom rounded-full bg-accent-green transition-transform duration-300 ease-out motion-reduce:transition-none ${active ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"}`}
        />
        {active && <span aria-hidden="true" className="size-1 shrink-0 rounded-full bg-black/60" />}
        <span className="relative grid overflow-hidden leading-5">
          <span className="col-start-1 row-start-1 transition-transform duration-300 ease-out group-hover:-translate-y-full motion-reduce:transition-none">
            {label}
          </span>
          <span aria-hidden="true" className="col-start-1 row-start-1 translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0 motion-reduce:transition-none">
            {label}
          </span>
        </span>
      </Link>
    </li>
  );
  const navItems = items.map(renderNavItem);
  const rightNavItems = rightItems.map(renderNavItem);

  return (
    <nav aria-label={title} className="relative w-full shrink-0" style={{ height: `${spacerHeight}px` }}>
      <div ref={pillRef} className={`fixed inset-x-3 top-12 z-50 mx-auto flex w-auto max-w-7xl items-center rounded-2xl border border-white/10 bg-[#171717] px-3 py-3 text-white shadow-[0_12px_28px_-18px_rgba(0,0,0,0.8)] md:inset-x-5 md:top-[52px] md:px-4 ${marketplace ? "flex-wrap justify-center gap-1 md:flex-nowrap md:gap-8 lg:gap-10" : "flex-wrap gap-3 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"}`}>
        {marketplace ? (
          <>
            <a
              href="https://wa.me/5491171410652?text=Hola%2C%20necesito%20ayuda%20con%20mi%20cuenta."
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-[#C9E94F] px-3 text-xs text-black transition-colors hover:bg-[#b8d43f] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#171717] md:px-4 md:text-sm lg:absolute lg:left-4 lg:top-1/2 lg:-translate-y-1/2"
            >
              <Headset aria-hidden="true" className="size-5 shrink-0 text-black" strokeWidth={1.8} />
              Soporte
            </a>
            <div className="flex shrink-0 items-center">
              <Link
                href="/dashboard/marketplace"
                className="flex min-h-10 shrink-0 cursor-pointer items-center gap-1 rounded-full px-2 text-xs text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green md:gap-2 md:px-3 md:text-sm"
              >
                Marketplace
                <span aria-hidden="true" className="dashboard-marketplace-icon">
                  <Store className="size-5 text-accent-green" strokeWidth={1.8} />
                </span>
              </Link>
            </div>
            {role && ["OWNER", "ADMIN", "DEV"].includes(role) && (
              <ul aria-label="Secciones del panel" className="order-5 flex w-full basis-full list-none items-center gap-1 overflow-x-auto p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:order-none md:w-auto md:min-w-0 md:basis-auto md:max-w-[min(36vw,460px)]">
                {navItems}
              </ul>
            )}
          </>
        ) : (
          <ul className="flex min-w-0 flex-1 list-none items-center gap-1 overflow-x-auto p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:col-start-1 md:row-start-1">
            {navItems}
          </ul>
        )}

        <Link
          href="/dashboard"
          aria-label="Devta, ir al panel"
          className="hidden rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-green md:block"
        >
          <BrandLogo inverse />
        </Link>

        {marketplace && !["OWNER", "ADMIN"].includes(role ?? "") && (
          <button
            type="button"
            disabled
            aria-label="Personalizado, próximamente"
            className="flex min-h-10 shrink-0 cursor-not-allowed flex-col items-center justify-center px-2 text-[11px] leading-tight text-white/45 opacity-50 md:px-3 md:text-xs"
          >
            <span className="flex items-center gap-1">
              Personalizado
              <Star aria-hidden="true" className="size-4 text-accent-green" strokeWidth={2} />
            </span>
            <span className="mt-0.5 text-[9px] tracking-wide">Próximamente</span>
          </button>
        )}

        {marketplace && (
          <div className="relative z-30 flex shrink-0 items-center gap-2 xl:absolute xl:right-4 xl:top-1/2 xl:-translate-y-1/2">
            <NotificationBell
              key={`${unreadNotifications}:${notifications.map((notification) => `${notification.id}-${notification.read}`).join(",")}`}
              initialNotifications={notifications}
              initialUnreadCount={unreadNotifications}
            />
            <DropdownMenu>
              <DropdownMenuTrigger
              render={
                <SpecularButton
                  size="sm"
                  radius={24}
                  tint="#292929"
                  tintOpacity={0.72}
                  textColor="#f5f5f5"
                  lineColor="#C9E94F"
                  baseColor="#343434"
                  intensity={0.38}
                  idleIntensity={0.1}
                  shineSize={5}
                  shineFade={42}
                  thickness={0.7}
                  glow={0.3}
                  speed={0.16}
                  followMouse
                  proximity={120}
                  autoAnimate={false}
                  className="!gap-3 !rounded-full !border !border-white/10 !py-3 !text-left shadow-none"
                >
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block break-words text-xs font-semibold leading-4 md:text-sm">{user?.fullName ?? "Mi cuenta"}</span>
                    {user?.email && <span className="block truncate text-[10px] leading-3 text-white/60 md:text-xs">{user.email}</span>}
                  </span>
                  <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-accent-green transition-transform duration-200 group-aria-expanded:rotate-180" />
                </SpecularButton>
              }
              aria-label="Abrir menú de cuenta"
                className="group relative min-w-0 shrink md:max-w-72"
              />
              <DropdownMenuContent align="end" className="w-64 border border-white/10 bg-[#1b1b1b]">
                <DropdownMenuItem render={<Link href="/dashboard/chats" />}>
                  <MessageCircle aria-hidden="true" className="text-accent-green" />
                  Mensajes
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/dashboard/orders" />}>
                  <ClipboardList aria-hidden="true" className="text-accent-green" />
                  Mis Pedidos
                </DropdownMenuItem>
                {role && ["OWNER", "ADMIN", "DEV"].includes(role) && (
                  <DropdownMenuItem render={<Link href="/dashboard/staff" />}>
                    <ClipboardList aria-hidden="true" className="text-accent-green" />
                    Pedidos del equipo
                  </DropdownMenuItem>
                )}
                {(role === "OWNER" || role === "ADMIN") && (
                  <DropdownMenuItem render={<Link href="/admin" />}>
                    <Shield aria-hidden="true" className="text-accent-green" />
                    Administración
                  </DropdownMenuItem>
                )}
                <form action={signOut}>
                  <DropdownMenuItem
                    render={<button type="submit" />}
                    nativeButton
                    className="rounded-full border border-rose-500/80 bg-rose-500/15 text-rose-400 hover:bg-rose-500/20 focus:bg-rose-500/20 focus:text-rose-300 [&_svg]:text-rose-400"
                  >
                    <LogOut aria-hidden="true" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {!marketplace && (
          <div className="ml-auto flex shrink-0 items-center gap-1 border-l border-white/10 pl-2 md:col-start-3 md:row-start-1 md:justify-self-end">
            {rightNavItems.length > 0 && (
              <ul className="flex list-none items-center gap-1 p-0">
                {rightNavItems}
              </ul>
            )}
            {role && roleLabels[role] && (
              <span className="px-2 text-xs font-medium text-accent-green md:text-sm">
                {roleLabels[role]}
              </span>
            )}
            <form action={signOut}>
              <button
                type="submit"
                  className="cursor-pointer rounded-full px-3 py-2 text-xs text-white/70 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-accent-green md:text-sm"
              >
                Salir
              </button>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
}
