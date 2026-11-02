"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Circle } from "lucide-react";
import { markNotificationRead } from "@/app/actions/notifications";
import type { DashboardNotification } from "@/lib/notification-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function NotificationBell({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: DashboardNotification[];
  initialUnreadCount: number;
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function openNotification(notification: DashboardNotification) {
    setLoadingId(notification.id);
    setError("");
    try {
      if (!notification.read) {
        await markNotificationRead(notification.id);
        setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
        setUnreadCount((current) => Math.max(0, current - 1));
      }
      router.push(notification.href);
      router.refresh();
    } catch {
      setError("No se pudo actualizar el aviso. Probá de nuevo.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={unreadCount ? `Notificaciones, ${unreadCount} sin leer` : "Notificaciones"}
            className="relative inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full text-accent-green transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green"
          >
            <Bell aria-hidden="true" className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute right-[9px] top-[9px] size-2.5 rounded-full border-2 border-[#171717] bg-red-500" aria-hidden="true" />
            )}
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-[min(92vw,25rem)] overflow-hidden border border-white/10 bg-[#1b1b1b] p-0">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <h2 className="font-heading text-xs text-white">Notificaciones</h2>
          {unreadCount > 0 && <span className="text-[11px] text-white/60">{unreadCount} sin leer</span>}
        </div>
        {notifications.length ? (
          <ul className="max-h-[min(60vh,24rem)] overflow-y-auto py-1">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <DropdownMenuItem
                  render={
                    <button
                      type="button"
                      disabled={loadingId === notification.id}
                      onClick={() => void openNotification(notification)}
                    />
                  }
                  className="min-h-0 items-start gap-3 whitespace-normal rounded-none px-4 py-3"
                >
                  <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${notification.read ? "bg-transparent" : "bg-accent-green"}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-xs font-semibold leading-5 text-white">{notification.title}</span>
                      <time className="shrink-0 pt-0.5 text-[10px] text-white/50">{formatNotificationDate(notification.createdAt)}</time>
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-white/65">{notification.message}</span>
                  </span>
                </DropdownMenuItem>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 py-8 text-center">
            <Circle aria-hidden="true" className="mx-auto size-5 text-white/35" />
            <p className="mt-2 text-sm text-white/80">Todavía no tenés notificaciones.</p>
            <p className="mt-1 text-xs text-white/50">Te avisaremos cuando haya novedades de tus proyectos.</p>
          </div>
        )}
        {error && <p role="alert" className="px-4 pb-2 text-xs text-rose-300">{error}</p>}
        <DropdownMenuItem
          render={<Link href="/dashboard/notificaciones" />}
          className="min-h-11 justify-center rounded-none border-t border-white/10 px-4 text-xs font-medium text-accent-green focus:bg-white/[0.06]"
        >
          Ver todas las notificaciones
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
