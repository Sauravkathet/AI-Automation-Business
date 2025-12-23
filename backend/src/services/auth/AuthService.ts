import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import User, { IUser } from '../../models/User';
import Organization from '../../models/Organization';
import { generateToken, hashToken } from '../../utils/crypto';
import { UserRole } from '../../types/workflow.types';
import logger from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';

export class AuthService {
  // Generate JWT tokens
  generateTokens(userId: string, organizationId: string, role: string) {
    const accessToken = jwt.sign(
      { userId, organizationId, role },
      config.JWT_ACCESS_SECRET,
      { expiresIn: config.JWT_ACCESS_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId, organizationId, role },
      config.JWT_REFRESH_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRY }
    );

    return { accessToken, refreshToken };
  }

  // Register new user with organization
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
  }) {
    try {
      // Check if user exists
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        throw new AppError(400, 'Email already registered');
      }

      // Create organization
      const slug = data.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);

      const webhookSecret = generateToken(32);

      const organization = await Organization.create({
        name: data.organizationName,
        slug: `${slug}-${Date.now()}`,
        settings: {
          webhookSecret,
          aiConfidenceThreshold: 0.7,
          requireApproval: true,
        },
      });

      // Create user
      const verificationToken = generateToken(32);

      const user = await User.create({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        organizationId: organization._id,
        role: UserRole.OWNER,
        verificationToken: hashToken(verificationToken),
      });

      // Generate tokens
      const tokens = this.generateTokens(
        user._id.toString(),
        organization._id.toString(),
        user.role
      );

      logger.info('User registered successfully', {
        userId: user._id,
        organizationId: organization._id,
      });

      return {
        user,
        organization,
        tokens,
        verificationToken, // Send unhashed token for email
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  // Login
  async login(email: string, password: string) {
    try {
      // Find user
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        throw new AppError(401, 'Invalid credentials');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        throw new AppError(401, 'Invalid credentials');
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      // Generate tokens
      const tokens = this.generateTokens(
        user._id.toString(),
        user.organizationId.toString(),
        user.role
      );

      logger.info('User logged in', { userId: user._id });

      return {
        user,
        tokens,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  // Verify email
  async verifyEmail(token: string) {
    try {
      const hashedToken = hashToken(token);

      const user = await User.findOne({ verificationToken: hashedToken });

      if (!user) {
        throw new AppError(400, 'Invalid or expired verification token');
      }

      user.emailVerified = true;
      user.verificationToken = undefined;
      await user.save();

      logger.info('Email verified', { userId: user._id });

      return user;
    } catch (error) {
      logger.error('Email verification error:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as any;

      const user = await User.findById(decoded.userId);

      if (!user) {
        throw new AppError(401, 'User not found');
      }

      // Generate new tokens (rotate refresh token)
      const tokens = this.generateTokens(
        user._id.toString(),
        user.organizationId.toString(),
        user.role
      );

      return tokens;
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw new AppError(401, 'Invalid refresh token');
    }
  }

  // Request password reset
  async requestPasswordReset(email: string) {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        // Don't reveal if user exists
        return { message: 'If email exists, reset link sent' };
      }

      const resetToken = generateToken(32);
      const hashedToken = hashToken(resetToken);

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      logger.info('Password reset requested', { userId: user._id });

      return { resetToken, user };
    } catch (error) {
      logger.error('Password reset request error:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(token: string, newPassword: string) {
    try {
      const hashedToken = hashToken(token);

      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        throw new AppError(400, 'Invalid or expired reset token');
      }

      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      logger.info('Password reset successfully', { userId: user._id });

      return user;
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }
}

export default new AuthService();