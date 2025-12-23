import axios from 'axios';
import User from '../../models/User';
import EmailService from '../auth/EmailService';
import { ActionType } from '../../types/workflow.types';
import logger from '../../utils/logger';

export class ActionExecutor {
  async execute(action: any, triggerData: any, organizationId: string) {
    try {
      switch (action.type) {
        case ActionType.EMAIL:
          return await this.executeEmailAction(action, triggerData, organizationId);

        case ActionType.WEBHOOK:
          return await this.executeWebhookAction(action, triggerData);

        case ActionType.NOTIFICATION:
          return await this.executeNotificationAction(
            action,
            triggerData,
            organizationId
          );

        case ActionType.LOG:
          return await this.executeLogAction(action, triggerData);

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      logger.error('Action execution error:', error);
      throw error;
    }
  }

  // Execute email action
  private async executeEmailAction(
    action: any,
    triggerData: any,
    organizationId: string
  ) {
    try {
      let recipient = action.config.to;

      // Handle template variables
      if (recipient === '{{user.email}}') {
        // Find organization owner
        const owner = await User.findOne({
          organizationId,
          role: 'owner',
        });
        recipient = owner?.email || '';
      }

      // Replace template variables in subject and body
      const subject = this.replaceTemplateVariables(
        action.config.subject || 'Workflow Alert',
        triggerData
      );

      const body = this.replaceTemplateVariables(
        action.config.body || '',
        triggerData
      );

      // Send email
      await EmailService.sendWorkflowNotification(recipient, subject, body);

      return {
        success: true,
        recipient,
        subject,
      };
    } catch (error) {
      logger.error('Email action error:', error);
      throw error;
    }
  }

  // Execute webhook action
  private async executeWebhookAction(action: any, triggerData: any) {
    try {
      const response = await axios({
        method: action.config.method || 'POST',
        url: action.config.url,
        data: action.config.payload || triggerData,
        headers: action.config.headers || {},
        timeout: 10000,
      });

      return {
        success: true,
        statusCode: response.status,
        data: response.data,
      };
    } catch (error: any) {
      logger.error('Webhook action error:', error);
      throw new Error(`Webhook failed: ${error.message}`);
    }
  }

  // Execute notification action (in-app notification)
  private async executeNotificationAction(
    action: any,
    triggerData: any,
    organizationId: string
  ) {
    try {
      // TODO: Implement in-app notification system
      // For now, log the notification
      logger.info('Notification triggered', {
        organizationId,
        message: action.config.message,
        triggerData,
      });

      return {
        success: true,
        message: action.config.message,
      };
    } catch (error) {
      logger.error('Notification action error:', error);
      throw error;
    }
  }

  // Execute log action
  private async executeLogAction(action: any, triggerData: any) {
    try {
      logger.info('Workflow log action', {
        message: action.config.message,
        triggerData,
      });

      return {
        success: true,
        logged: true,
      };
    } catch (error) {
      logger.error('Log action error:', error);
      throw error;
    }
  }

  // Replace template variables in strings
  private replaceTemplateVariables(template: string, data: any): string {
    let result = template;

    // Replace {{field.path}} with actual values
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = template.matchAll(regex);

    for (const match of matches) {
      const path = match[1].trim();
      const value = this.getFieldValue(data, path);
      result = result.replace(match[0], String(value || ''));
    }

    return result;
  }

  // Get field value from nested object
  private getFieldValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

export default new ActionExecutor();