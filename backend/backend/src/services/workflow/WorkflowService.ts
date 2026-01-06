import Workflow from '../../models/Workflow';
import Organization from '../../models/Organization';
import WorkflowParser from '../ai/WorkflowParser';
import { WorkflowStatus } from '../../types/workflow.types';
import { AppError } from '../../middleware/errorHandler';
import logger from '../../utils/logger';

export class WorkflowService {
  // Create workflow from natural language
  async createFromNaturalLanguage(
    organizationId: string,
    userId: string,
    naturalLanguage: string,
    name?: string
  ) {
    try {
      // Parse natural language with AI
      const { workflow: parsed, tokensUsed } = await WorkflowParser.parseNaturalLanguage(
        naturalLanguage
      );

      // Get organization settings
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new AppError(404, 'Organization not found');
      }

      // Check if AI confidence is below threshold
      const requiresApproval = 
        parsed.confidence < organization.settings.aiConfidenceThreshold ||
        organization.settings.requireApproval;

      // Create workflow
      const workflow = await Workflow.create({
        organizationId,
        createdBy: userId,
        name: name || `Workflow: ${parsed.intent}`,
        naturalLanguage,
        trigger: parsed.trigger,
        conditions: parsed.conditions || [],
        actions: parsed.actions,
        aiGenerated: true,
        aiConfidence: parsed.confidence,
        aiExplanation: parsed.reasoning,
        status: requiresApproval ? WorkflowStatus.DRAFT : WorkflowStatus.ACTIVE,
      });

      // Update organization usage
      organization.usage.aiCallsThisMonth += 1;
      await organization.save();

      logger.info('Workflow created from natural language', {
        workflowId: workflow._id,
        confidence: parsed.confidence,
        requiresApproval,
        tokensUsed,
      });

      return {
        workflow,
        requiresApproval,
        aiMetadata: {
          confidence: parsed.confidence,
          reasoning: parsed.reasoning,
          tokensUsed,
        },
      };
    } catch (error) {
      logger.error('Workflow creation error:', error);
      throw error;
    }
  }

  // Create workflow manually
  async createManual(organizationId: string, userId: string, data: any) {
    try {
      const workflow = await Workflow.create({
        organizationId,
        createdBy: userId,
        ...data,
        aiGenerated: false,
        status: WorkflowStatus.DRAFT,
      });

      logger.info('Manual workflow created', { workflowId: workflow._id });

      return workflow;
    } catch (error) {
      logger.error('Manual workflow creation error:', error);
      throw error;
    }
  }

  // Get workflows for organization
  async getAll(organizationId: string, filters: any = {}) {
    try {
      const query: any = { organizationId };

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.createdBy) {
        query.createdBy = filters.createdBy;
      }

      const workflows = await Workflow.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('approvedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50)
        .skip(filters.skip || 0);

      const total = await Workflow.countDocuments(query);

      return { workflows, total };
    } catch (error) {
      logger.error('Get workflows error:', error);
      throw error;
    }
  }

  // Get single workflow
  async getById(workflowId: string, organizationId: string) {
    try {
      const workflow = await Workflow.findOne({
        _id: workflowId,
        organizationId,
      })
        .populate('createdBy', 'firstName lastName email')
        .populate('approvedBy', 'firstName lastName email');

      if (!workflow) {
        throw new AppError(404, 'Workflow not found');
      }

      return workflow;
    } catch (error) {
      logger.error('Get workflow error:', error);
      throw error;
    }
  }

  // Update workflow
  async update(workflowId: string, organizationId: string, updates: any) {
    try {
      const workflow = await Workflow.findOneAndUpdate(
        { _id: workflowId, organizationId },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!workflow) {
        throw new AppError(404, 'Workflow not found');
      }

      logger.info('Workflow updated', { workflowId });

      return workflow;
    } catch (error) {
      logger.error('Update workflow error:', error);
      throw error;
    }
  }

  // Approve AI-generated workflow
  async approve(workflowId: string, organizationId: string, userId: string) {
    try {
      const workflow = await Workflow.findOne({
        _id: workflowId,
        organizationId,
      });

      if (!workflow) {
        throw new AppError(404, 'Workflow not found');
      }

      if (workflow.status !== WorkflowStatus.DRAFT) {
        throw new AppError(400, 'Only draft workflows can be approved');
      }

      workflow.approvedBy = userId as any;
      workflow.status = WorkflowStatus.ACTIVE;
      await workflow.save();

      logger.info('Workflow approved', { workflowId, approvedBy: userId });

      return workflow;
    } catch (error) {
      logger.error('Approve workflow error:', error);
      throw error;
    }
  }

  // Activate workflow
  async activate(workflowId: string, organizationId: string) {
    try {
      const workflow = await this.update(workflowId, organizationId, {
        status: WorkflowStatus.ACTIVE,
      });

      return workflow;
    } catch (error) {
      logger.error('Activate workflow error:', error);
      throw error;
    }
  }

  // Pause workflow
  async pause(workflowId: string, organizationId: string) {
    try {
      const workflow = await this.update(workflowId, organizationId, {
        status: WorkflowStatus.PAUSED,
      });

      return workflow;
    } catch (error) {
      logger.error('Pause workflow error:', error);
      throw error;
    }
  }

  // Delete workflow
  async delete(workflowId: string, organizationId: string) {
    try {
      const workflow = await Workflow.findOneAndUpdate(
        { _id: workflowId, organizationId },
        { status: WorkflowStatus.ARCHIVED },
        { new: true }
      );

      if (!workflow) {
        throw new AppError(404, 'Workflow not found');
      }

      logger.info('Workflow deleted', { workflowId });

      return workflow;
    } catch (error) {
      logger.error('Delete workflow error:', error);
      throw error;
    }
  }
}

export default new WorkflowService();