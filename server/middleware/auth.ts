import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

// Define custom user type
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

// Define authenticated request type
export interface AuthenticatedRequest extends Request {
  user: User;
}

// Authentication middleware
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if we have a session and userId
    if (!req.session || !req.session.userId) {
      console.log('[Auth Debug] No session or userId:', {
        hasSession: !!req.session,
        sessionId: req.sessionID,
        userId: req.session?.userId
      });
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      console.log('[Auth Debug] User not found for session:', {
        sessionId: req.sessionID,
        userId: req.session.userId
      });
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = user;
    
    console.log('[Auth Debug] Authentication successful:', {
      sessionId: req.sessionID,
      userId: user.id,
      username: user.username
    });

    next();
  } catch (error) {
    console.error('[Auth Debug] Authentication error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


