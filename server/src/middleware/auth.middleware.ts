import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

declare global {
  namespace Express {
    interface Request {
      user?: any; // To be typed properly with Prisma User model
      session?: any;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.cookies?.sessionId;
    
    if (!sessionId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date() || session.revokedAt) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Session invalid or expired' } });
    }

    // Update last activity
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() }
    });

    req.user = session.user;
    req.session = session;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } });
  }
  next();
};

export const requireLocalIp = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress;
  // Basic check for local IPs (IPv4 and IPv6)
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
    next();
  } else {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'This operation is restricted to the local server machine.' } });
  }
};
