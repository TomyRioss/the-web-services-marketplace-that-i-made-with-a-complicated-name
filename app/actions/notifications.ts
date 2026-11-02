"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { ensurePocketBaseAdmin, pbFilterValue } from "@/lib/pocketbase";
import type { DashboardNotification } from "@/lib/notification-types";

type NotificationRecord = DashboardNotification & { recipient: string };

async function getMyNotificationRecords() {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");

  const pb = await ensurePocketBaseAdmin();
  const records = (await pb.collection("ttmcobuild_notifications").getFullList({
    filter: `recipient = ${pbFilterValue(session.userId)}`,
    sort: "-createdAt",
  })) as unknown as NotificationRecord[];
  return records;
}

function mapNotification({ id, type, title, message, href, createdAt, read }: NotificationRecord): DashboardNotification {
  return { id, type, title, message, href, createdAt, read };
}

export async function getNotificationSummary() {
  const records = await getMyNotificationRecords();
  return {
    notifications: records.slice(0, 5).map(mapNotification),
    unreadCount: records.filter((record) => !record.read).length,
  };
}

export async function getMyNotifications() {
  const records = await getMyNotificationRecords();
  return records.map(mapNotification);
}

export async function markNotificationRead(notificationId: string) {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  if (!/^[a-zA-Z0-9]{15}$/.test(notificationId)) throw new Error("Notificación inválida.");

  const pb = await ensurePocketBaseAdmin();
  const notification = (await pb.collection("ttmcobuild_notifications").getOne(notificationId)) as unknown as NotificationRecord;
  if (notification.recipient !== session.userId) throw new Error("No autorizado");
  if (!notification.read) {
    await pb.collection("ttmcobuild_notifications").update(notificationId, { read: true });
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/notificaciones");
}

export async function markAllNotificationsRead() {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");

  const pb = await ensurePocketBaseAdmin();
  const unread = (await pb.collection("ttmcobuild_notifications").getFullList({
    filter: `recipient = ${pbFilterValue(session.userId)} && read = false`,
  })) as unknown as NotificationRecord[];
  await Promise.all(unread.map((notification) => pb.collection("ttmcobuild_notifications").update(notification.id, { read: true })));

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/notificaciones");
}
