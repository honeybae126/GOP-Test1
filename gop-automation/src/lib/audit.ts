import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'
import type { AuditActorRole, AuditAction } from '@/generated/prisma/client'

export async function createAuditEntry(
  actorId: string | null,
  actorRole: AuditActorRole,
  action: AuditAction,
  requestId: string | null,
  beforeState: Record<string, any> | null = null,
  afterState: Record<string, any> | null = null,
  metadata: Record<string, any> = {}
): Promise<void> {
  await prisma.auditEntry.create({
    data: {
      actorId,
      actorRole,
      action,
      requestId,
      beforeState: beforeState ?? Prisma.DbNull,
      afterState: afterState ?? Prisma.DbNull,
      metadata,
      ipAddress: null,
      sessionId: null,
    },
  })
}

export async function getAuditHistory(requestId: string): Promise<any[]> {
  return prisma.auditEntry.findMany({
    where: { requestId },
    orderBy: { createdAt: 'desc' },
  })
}
