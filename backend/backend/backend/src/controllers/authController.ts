import { Request, Response } from 'express';
import AuthService from '../services/auth/AuthService';
import EmailService from '../services/auth/EmailService';
import { asyncHandler } from '../middleware/errorHandler';
import { config } from '../config/env';
import logger from '../utils/logger';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, organizationName } = req.body;

  const result = await AuthService.register({
    email,
    password,
    firstName,
    lastName,
    organizationName,
  });

  // Send verification email
  await EmailService.sendVerificationEmail(
    email,
    firstName,
    result.verificationToken
  );

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', result.tokens.refreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify your email.',
    data: {
      user: result.user,
      organization: result.organization,
      accessToken: result.tokens.accessToken,
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await AuthService.login(email, password);

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', result.tokens.refreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: result.user,
      accessToken: result.tokens.accessToken,
    },
  });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  await AuthService.verifyEmail(token);

  res.json({
    success: true,
    message: 'Email verified successfully',
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ error: 'No refresh token provided' });
    return;
  }

  const tokens = await AuthService.refreshAccessToken(refreshToken);

  // Set new refresh token
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    data: {
      accessToken: tokens.accessToken,
    },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie('refreshToken');

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export const requestPasswordReset = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const result = await AuthService.requestPasswordReset(email);

    // Send reset email if user exists
    if (result.user) {
      await EmailService.sendPasswordResetEmail(
        email,
        result.user.firstName,
        result.resetToken!
      );
    }

    res.json({
      success: true,
      message: 'If email exists, password reset link has been sent',
    });
  }
);

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  await AuthService.resetPassword(token, newPassword);

  res.json({
    success: true,
    message: 'Password reset successfully',
  });
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});