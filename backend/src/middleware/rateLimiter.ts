import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../config/redis';
import { config } from '../config/env';

export const generalLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate:general:',
  }),
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate:auth:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later',
});

export const aiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate:ai:',
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many AI requests, please slow down',
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
});

export const webhookLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate:webhook:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000,
  message: 'Webhook rate limit exceeded',
  keyGenerator: (req) => {
    return req.params.organizationId || req.ip;
  },
});