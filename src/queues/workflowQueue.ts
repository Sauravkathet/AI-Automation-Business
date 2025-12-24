import { workflowQueue } from '../config/queue';
import ExecutionEngine from '../services/workflow/ExecutionEngine';
import logger from '../utils/logger';

// Process workflow execution jobs
workflowQueue.process(async (job) => {
  const { workflowId, organizationId, triggerData } = job.data;

  logger.info('Processing workflow execution', {
    jobId: job.id,
    workflowId,
    organizationId,
  });

  try {
    const execution = await ExecutionEngine.execute(
      workflowId,
      organizationId,
      triggerData
    );

    logger.info('Workflow execution completed', {
      jobId: job.id,
      executionId: execution._id,
      status: execution.status,
    });

    return { executionId: execution._id, status: execution.status };
  } catch (error: any) {
    logger.error('Workflow execution failed', {
      jobId: job.id,
      workflowId,
      error: error.message,
    });

    throw error;
  }
});

// Handle job completion
workflowQueue.on('completed', (job, result) => {
  logger.info('Workflow job completed', { jobId: job.id, result });
});

// Handle job failure
workflowQueue.on('failed', (job, error) => {
  logger.error('Workflow job failed', {
    jobId: job?.id,
    error: error.message,
  });
});

export default workflowQueue;