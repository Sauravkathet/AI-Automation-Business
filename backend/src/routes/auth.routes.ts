import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate, refreshTokenAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';
import { registerSchema, loginSchema } from '../utils/validators';
import Joi from 'joi';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login
);

router.post(
  '/verify-email',
  validate(Joi.object({ token: Joi.string().required() })),
  authController.verifyEmail
);

router.post('/refresh', refreshTokenAuth, authController.refreshToken);

router.post('/logout', authController.logout);

router.post(
  '/forgot-password',
  authLimiter,
  validate(Joi.object({ email: Joi.string().email().required() })),
  authController.requestPasswordReset
);

router.post(
  '/reset-password',
  validate(
    Joi.object({
      token: Joi.string().required(),
      newPassword: Joi.string().min(8).required(),
    })
  ),
  authController.resetPassword
);

router.get('/me', authenticate, authController.getCurrentUser);

export default router;