import "server-only";
import { db } from "@/lib/db";
import { getCurrentUser } from "./auth";
import type { NotificationType } from "@prisma/client";

/**
 * Crea una notificación para un usuario específico
 */
export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  return db.notification.create({
    data: {
      organizationId: user.organizationId,
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}

/**
 * Obtiene las notificaciones no leídas del usuario actual
 */
export async function getUnreadNotifications() {
  const user = await getCurrentUser();
  if (!user) return [];

  return db.notification.findMany({
    where: {
      userId: user.id,
      status: "UNREAD",
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

/**
 * Marca una notificación como leída
 */
export async function markNotificationAsRead(notificationId: string) {
  return db.notification.update({
    where: { id: notificationId },
    data: {
      status: "READ",
      readAt: new Date(),
    },
  });
}

/**
 * Marca todas las notificaciones del usuario como leídas
 */
export async function markAllNotificationsAsRead() {
  const user = await getCurrentUser();
  if (!user) return;

  return db.notification.updateMany({
    where: {
      userId: user.id,
      status: "UNREAD",
    },
    data: {
      status: "READ",
      readAt: new Date(),
    },
  });
}

/**
 * Cuenta las notificaciones no leídas del usuario
 */
export async function getUnreadNotificationCount() {
  const user = await getCurrentUser();
  if (!user) return 0;

  return db.notification.count({
    where: {
      userId: user.id,
      status: "UNREAD",
    },
  });
}

/**
 * Archiva una notificación
 */
export async function archiveNotification(notificationId: string) {
  return db.notification.update({
    where: { id: notificationId },
    data: { status: "ARCHIVED" },
  });
}
