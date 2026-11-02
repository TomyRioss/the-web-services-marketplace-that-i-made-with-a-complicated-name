"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Bell } from "lucide-react";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications";
import type { DashboardNotification } from "@/lib/notification-types";

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function NotificationList({ initialNotifications }: { initialNotifications: DashboardNotification[] }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  async function openNotification(notification: DashboardNotification) {
    setBusy(true);
    setError("");
    try {
      if (!notification.read) {
        await markNotificationRead(notification.id);
        setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
      }
      router.push(notification.href);
      router.refresh();
    } catch {
      setError("No se pudo actualizar el aviso. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function markAllRead() {
    setBusy(true);
    setError("");
    try {
      await markAllNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
      router.refresh();
    } catch {
      setError("No se pudieron marcar los avisos como leídos. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-7">
      {error && <p role="alert" className="mb-3 text-sm text-rose-300">{error}</p>}
      {notifications.length > 0 && unreadCount > 0 && (
        <div className="mb-4 flex justify-end">
          <button type="button" disabled={busy} onClick={() => void markAllRead()} className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-xs text-accent-green transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green disabled:opacity-50">
            <CheckCheck aria-hidden="true" className="size-4" />
            Marcar todas como leídas
          </button>
        </div>
      )}
      {notifications.length === 0 ? (
        <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-white/15 px-6 py-10 text-center">
          <Bell aria-hidden="true" className="size-6 text-accent-green" />
          <p className="mt-3 text-sm text-white/75">Todavía no tenés notificaciones.</p>
          <p className="mt-1 text-xs text-white/50">Te avisaremos cuando haya novedades de tus proyectos.</p>
        </div>
      ) : (
        <ul className="divide-y divide-white/10 border-y border-white/10">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <button type="button" disabled={busy} onClick={() => void openNotification(notification)} className="flex w-full items-start gap-4 px-3 py-5 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-green disabled:opacity-60 sm:px-4">
                <span className={`mt-2 size-2 shrink-0 rounded-full ${notification.read ? "bg-white/20" : "bg-red-500"}`} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <span className="font-medium text-white">{notification.title}</span>
                    <time className="text-xs text-white/50">{formatNotificationDate(notification.createdAt)}</time>
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-white/65">{notification.message}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
