import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { prisma } from '../utils/prisma';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const page = Number(req.query.page) || 1;
  const skip = (page - 1) * limit;

  // Normal users only see activity related to them or general system activity they are permitted to see
  // For this showcase, users see all non-sensitive activity, but admin sees everything.
  const where: any = {};
  if (req.user.role !== 'ADMIN') {
    // Basic privacy: see own actions or actions on files they own (simplified)
    // For a LAN share, seeing who uploaded what is usually intended
    // Let's just exclude failed logins
    where.action = { notIn: ['USER_LOGIN_FAILED'] };
  }

  const [activities, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true } } }
    }),
    prisma.activityLog.count({ where })
  ]);

  res.json({ success: true, data: { activities, total, page, limit } });
});

export default router;
