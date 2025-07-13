import { prisma } from '../lib/prisma';
import { randomBytes } from 'crypto';

export class SessionService {
  private static readonly SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  static async createSession(userId: number): Promise<string> {
    // Generate a random token
    const token = randomBytes(32).toString('hex');

    // Calculate expiry date
    const expiresAt = new Date(Date.now() + this.SESSION_EXPIRY);

    // Create session in database
    await prisma.session.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  static async validateSession(token: string) {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) {
      return null;
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      await this.deleteSession(token);
      return null;
    }

    // Update last used timestamp
    await prisma.session.update({
      where: { token },
      data: { lastUsedAt: new Date() },
    });

    return session;
  }

  static async deleteSession(token: string) {
    await prisma.session.delete({
      where: { token },
    });
  }

  static async deleteAllUserSessions(userId: number) {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }
} 