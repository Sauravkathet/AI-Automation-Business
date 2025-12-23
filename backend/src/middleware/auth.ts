import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import User from '../models/User';
import logger from '../utils/logger';

interface JwtPayload {
  userId: string;
  organizationId: string;
  role: string;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;

      // Fetch user from database
      const user = await User.findById(decoded.userId);

      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      if (!user.emailVerified) {
        res.status(403).json({ error: 'Email not verified' });
        return;
      }

      // Attach user to request
      req.user = user;
      req.organizationId = user.organizationId.toString();

      next();
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        res.status(401).json({ error: 'Token expired' });
        return;
      }
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
        const user = await User.findById(decoded.userId);
        
        if (user && user.emailVerified) {
          req.user = user;
          req.organizationId = user.organizationId.toString();
        }
      } catch (error) {
        // Silent fail for optional auth
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    next();
  }
};

export const refreshTokenAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ error: 'No refresh token provided' });
      return;
    }

    try {
      const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as JwtPayload;
      
      const user = await User.findById(decoded.userId);

      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }
  } catch (error) {
    logger.error('Refresh token auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};