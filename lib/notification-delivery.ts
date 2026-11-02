import "server-only";

import { ensurePocketBaseAdmin } from "@/lib/pocketbase";
import type { NotificationType } from "@/lib/notification-types";

const notificationTitles: Record<NotificationType, string> = {
  ASSIGNMENT: "Programador encontrado",
  MESSAGE: "Mensaje del equipo",
  STATUS: "Cambio de estado del proyecto",
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

async function sendNotificationEmail(to: string, title: string, message: string, href: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Falta configurar Resend.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "Devta <staff@ttmagencia.com>",
      to: [to],
      subject: title,
      html: `<p>${escapeHtml(message)}</p><p><a href="https://ttmagencia.com${escapeHtml(href)}">Ver mi pedido</a></p>`,
      text: `${message}\n\nVer mi pedido: https://ttmagencia.com${href}`,
    }),
  });

  if (!response.ok) throw new Error("Resend rechazó el envío del correo.");
}

export async function createClientNotification({
  recipientId,
  orderId,
  type,
  message,
  href,
  email,
}: {
  recipientId: string;
  orderId: string;
  type: NotificationType;
  message: string;
  href: string;
  email: string;
}) {
  const pb = await ensurePocketBaseAdmin();
  const title = notificationTitles[type];
  const createdAt = new Date().toISOString();
  const record = await pb.collection("ttmcobuild_notifications").create({
    recipient: recipientId,
    order: orderId,
    type,
    title,
    message,
    href,
    createdAt,
    read: false,
  });

  let emailError: string | null = null;
  try {
    await sendNotificationEmail(email, title, message, href);
  } catch (error) {
    emailError = error instanceof Error ? error.message : "No se pudo enviar el correo.";
  }

  return { id: record.id, emailSent: emailError === null, emailError };
}
