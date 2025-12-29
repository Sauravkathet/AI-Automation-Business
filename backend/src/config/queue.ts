import Queue from 'bull';
import { config } from './env';
import logger from '../utils/logger';

export const workflowQueue = new Queue('workflow-execution', config.REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

export const emailQueue = new Queue('email-sending', config.REDIS_URL, {
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 50,
    removeOnFail: 500,
  },
});

workflowQueue.on('error', (error) => {
  logger.error('Workflow queue error:', error);
});

emailQueue.on('error', (error) => {
  logger.error('Email queue error:', error);
});

export default { workflowQueue, emailQueue };