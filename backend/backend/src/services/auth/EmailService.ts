import nodemailer from 'nodemailer';
import { config } from '../../config/env';
import logger from '../../utils/logger';
import { emailQueue } from '../../config/queue';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: false,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASSWORD,
      },
    });
  }

  // Send email directly
  private async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: config.EMAIL_FROM,
        to,
        subject,
        html,
      });

      logger.info('Email sent successfully', { to, subject });
    } catch (error) {
      logger.error('Email sending error:', error);
      throw error;
    }
  }

  // Queue email for async sending
  async queueEmail(to: string, subject: string, html: string) {
    try {
      await emailQueue.add({
        to,
        subject,
        html,
      });

      logger.info('Email queued', { to, subject });
    } catch (error) {
      logger.error('Email queuing error:', error);
      throw error;
    }
  }

  // Verification email
  async sendVerificationEmail(email: string, firstName: string, token: string) {
    const verificationUrl = `${config.CLIENT_URL}/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #4F46E5; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Welcome to Workflow Automation Platform!</h2>
          <p>Hi ${firstName},</p>
          <p>Thank you for registering. Please verify your email address to get started.</p>
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <div class="footer">
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.queueEmail(email, 'Verify Your Email Address', html);
  }

  // Password reset email
  async sendPasswordResetEmail(email: string, firstName: string, token: string) {
    const resetUrl = `${config.CLIENT_URL}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #4F46E5; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px;
            margin: 20px 0;
          }
          .warning { background-color: #FEF3C7; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>Hi ${firstName},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <p>This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and ensure your account is secure.</p>
          </div>
          <div class="footer">
            <p>For security reasons, we never send your password via email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.queueEmail(email, 'Reset Your Password', html);
  }

  // Workflow notification email
  async sendWorkflowNotification(
    email: string,
    workflowName: string,
    message: string
  ) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .alert { background-color: #FEE2E2; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #EF4444; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Workflow Alert: ${workflowName}</h2>
          <div class="alert">
            <p>${message}</p>
          </div>
          <p>View full details in your <a href="${config.CLIENT_URL}/executions">dashboard</a>.</p>
          <div class="footer">
            <p>You're receiving this because your workflow triggered a notification action.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.queueEmail(email, `Workflow Alert: ${workflowName}`, html);
  }

  // Team invitation email
  async sendInvitationEmail(
    email: string,
    organizationName: string,
    inviterName: string,
    token: string
  ) {
    const inviteUrl = `${config.CLIENT_URL}/accept-invitation?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #4F46E5; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>You've been invited to join ${organizationName}</h2>
          <p>${inviterName} has invited you to collaborate on Workflow Automation Platform.</p>
          <a href="${inviteUrl}" class="button">Accept Invitation</a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${inviteUrl}</p>
          <p>This invitation will expire in 7 days.</p>
          <div class="footer">
            <p>If you don't want to join this organization, simply ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.queueEmail(email, `Invitation to join ${organizationName}`, html);
  }
}

export default new EmailService();