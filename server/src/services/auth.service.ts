import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ActivityService } from './activity.service';

const activityService = new ActivityService();

export class AuthService {
  async register(username: string, passwordRaw: string, ipAddress: string) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      throw new Error('Username already exists');
    }

    const isFirstUser = (await prisma.user.count()) === 0;
    const role = isFirstUser ? 'ADMIN' : 'USER';
    const passwordHash = await bcrypt.hash(passwordRaw, 10);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role
      }
    });

    activityService.log({
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      ipAddress
    });

    return this.createSession(user.id, ipAddress);
  }

  async login(username: string, passwordRaw: string, ipAddress: string) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.isActive) {
      activityService.log({ userId: null, action: 'USER_LOGIN_FAILED', entityType: 'USER', ipAddress, metadata: { username } });
      return null;
    }

    const valid = await bcrypt.compare(passwordRaw, user.passwordHash);
    if (!valid) {
      activityService.log({ userId: user.id, action: 'USER_LOGIN_FAILED', entityType: 'USER', ipAddress });
      return null;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    activityService.log({ userId: user.id, action: 'USER_LOGIN', entityType: 'USER', entityId: user.id, ipAddress });

    return this.createSession(user.id, ipAddress);
  }

  async logout(sessionId: string, userId: string | undefined, ipAddress: string) {
    await prisma.session.updateMany({
      where: { id: sessionId },
      data: { revokedAt: new Date() }
    });

    if (userId) {
      activityService.log({ userId, action: 'USER_LOGOUT', entityType: 'USER', entityId: userId, ipAddress });
    }
  }

  private async createSession(userId: string, ipAddress: string) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const session = await prisma.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    });

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return { user, session };
  }
}
