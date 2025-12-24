import { emailQueue } from '../config/queue';
import nodemailer from 'nodemailer';
import { config } from '../config/env';
import logger from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: false,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASSWORD,
  },
});

// Process email sending jobs
emailQueue.process(async (job) => {
  const { to, subject, html } = job.data;

  logger.info('Processing email job', { jobId: job.id, to, subject });

  try {
    await transporter.sendMail({
      from: config.EMAIL_FROM,
      to,
      subject,
      html,
    });

    logger.info('Email sent successfully', { jobId: job.id, to });

    return { sent: true, to };
  } catch (error: any) {
    logger.error('Email sending failed', {
      jobId: job.id,
      to,
      error: error.message,
    });

    throw error;
  }
});

emailQueue.on('completed', (job, result) => {
  logger.info('Email job completed', { jobId: job.id, result });
});

emailQueue.on('failed', (job, error) => {
  logger.error('Email job failed', {
    jobId: job?.id,
    error: error.message,
  });
});

export default emailQueue;