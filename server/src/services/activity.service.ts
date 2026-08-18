import { prisma } from '../utils/prisma';

export interface ActivityLogInput {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  fileName?: string | null;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class ActivityService {
  log(data: ActivityLogInput) {
    // Fire and forget - do not await in the critical path to avoid blocking
    prisma.activityLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        fileName: data.fileName,
        metadata: data.metadata || null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      }
    }).catch((err) => {
      console.error('Failed to log activity asynchronously:', err);
    });
  }
}
