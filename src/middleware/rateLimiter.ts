import rateLimit from 'express-rate-limit';
import { config } from '../config/env';
import { Request } from 'express';

export const generalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later',
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many AI requests, please slow down',
  keyGenerator: (req: Request) => {
    return req.user?.id || req.ip || 'unknown';
  },
});

export const webhookLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000,
  message: 'Webhook rate limit exceeded',
  keyGenerator: (req: Request) => {
    return req.params.organizationId || req.ip || 'unknown';
  },
}); 