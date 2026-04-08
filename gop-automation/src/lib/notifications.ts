import { prisma } from '@/lib/prisma'
import type { NotificationEvent, Role } from '@/generated/prisma/client'

export async function createNotification(
  recipientId: string,
  recipientRole: Role,
  eventType: NotificationEvent,
  requestId: string | null,
  metadata: Record<string, any> = {}
): Promise<void> {
  await prisma.notification.create({
    data: {
      recipientId,
      recipientRole,
      eventType,
      requestId,
      metadata,
    },
  })
}

export async function markAsRead(notificationId: string, userId: string): Promise<boolean> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  })
  if (!notification || notification.recipientId !== userId) {
    throw new Error('Notification not found or access denied')
  }
  await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  })
  return true
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      recipientId: userId,
      readAt: null,
    },
  })
}

export async function getNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
