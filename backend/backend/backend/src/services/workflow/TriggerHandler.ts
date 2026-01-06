import { workflowQueue } from '../../config/queue';
import Workflow from '../../models/Workflow';
import { TriggerType } from '../../types/workflow.types';
import logger from '../../utils/logger';

export class TriggerHandler {
  // Handle webhook trigger
  async handleWebhook(
    workflowId: string,
    organizationId: string,
    payload: any
  ) {
    try {
      // Verify workflow exists and is active
      const workflow = await Workflow.findOne({
        _id: workflowId,
        organizationId,
        status: 'active',
        'trigger.type': TriggerType.WEBHOOK,
      });

      if (!workflow) {
        logger.warn('Webhook received for inactive/non-existent workflow', {
          workflowId,
          organizationId,
        });
        return null;
      }

      // Queue workflow execution
      await workflowQueue.add({
        workflowId: workflow._id.toString(),
        organizationId,
        triggerData: payload,
      });

      logger.info('Webhook trigger queued', { workflowId });

      return { queued: true, workflowId };
    } catch (error) {
      logger.error('Webhook trigger error:', error);
      throw error;
    }
  }

  // Handle manual trigger
  async handleManual(
    workflowId: string,
    organizationId: string,
    payload: any = {}
  ) {
    try {
      const workflow = await Workflow.findOne({
        _id: workflowId,
        organizationId,
        status: 'active',
      });

      if (!workflow) {
        throw new Error('Workflow not found or not active');
      }

      // Queue workflow execution
      await workflowQueue.add({
        workflowId: workflow._id.toString(),
        organizationId,
        triggerData: payload,
      });

      logger.info('Manual trigger queued', { workflowId });

      return { queued: true, workflowId };
    } catch (error) {
      logger.error('Manual trigger error:', error);
      throw error;
    }
  }

  // TODO: Handle scheduled triggers (cron-based)
  async handleScheduled() {
    // Implementation for cron-based scheduling
    // Could use node-cron or Bull's repeat feature
  }
}

export default new TriggerHandler();