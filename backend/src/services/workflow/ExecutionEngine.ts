import Execution, { IExecution } from '../../models/Execution';
import AIAnalysis from '../../models/AIAnalysis';
import Workflow from '../../models/Workflow';
import Organization from '../../models/Organization';
import IntentClassifier from '../ai/IntentClassifier';
import ActionExecutor from './ActionExecutor';
import {
  ExecutionStatus,
  StepStatus,
  StepType,
  ConditionOperator,
} from '../../types/workflow.types';
import { AppError } from '../../middleware/errorHandler';
import logger from '../../utils/logger';

export class ExecutionEngine {
  // Execute workflow
  async execute(
    workflowId: string,
    organizationId: string,
    triggerData: any
  ): Promise<IExecution> {
    const startTime = Date.now();

    try {
      // Fetch workflow
      const workflow = await Workflow.findOne({
        _id: workflowId,
        organizationId,
      });

      if (!workflow) {
        throw new AppError(404, 'Workflow not found');
      }

      if (workflow.status !== 'active') {
        throw new AppError(400, 'Workflow is not active');
      }

      // Create execution record
      const execution = await Execution.create({
        organizationId,
        workflowId,
        trigger: {
          type: workflow.trigger.type,
          data: triggerData,
        },
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
        steps: [],
      });

      logger.info('Workflow execution started', {
        executionId: execution._id,
        workflowId,
      });

      try {
        // Step 1: Evaluate conditions
        const conditionsPass = await this.evaluateConditions(
          workflow,
          triggerData,
          execution
        );

        if (!conditionsPass) {
          execution.status = ExecutionStatus.COMPLETED;
          execution.completedAt = new Date();
          execution.duration = Date.now() - startTime;
          await execution.save();

          logger.info('Workflow execution completed (conditions not met)', {
            executionId: execution._id,
          });

          return execution;
        }

        // Step 2: Execute actions
        await this.executeActions(workflow, triggerData, execution);

        // Mark as completed
        execution.status = ExecutionStatus.COMPLETED;
        execution.completedAt = new Date();
        execution.duration = Date.now() - startTime;
        await execution.save();

        // Update organization usage
        await Organization.findByIdAndUpdate(organizationId, {
          $inc: { 'usage.workflowsExecuted': 1 },
        });

        logger.info('Workflow execution completed successfully', {
          executionId: execution._id,
          duration: execution.duration,
        });

        return execution;
      } catch (error: any) {
        // Mark as failed
        execution.status = ExecutionStatus.FAILED;
        execution.completedAt = new Date();
        execution.duration = Date.now() - startTime;
        execution.steps.push({
          type: StepType.ACTION_EXECUTE,
          status: StepStatus.FAILED,
          input: {},
          output: {},
          error: error.message,
          duration: 0,
          timestamp: new Date(),
        });
        await execution.save();

        logger.error('Workflow execution failed', {
          executionId: execution._id,
          error: error.message,
        });

        throw error;
      }
    } catch (error) {
      logger.error('Execution engine error:', error);
      throw error;
    }
  }

  // Evaluate workflow conditions
  private async evaluateConditions(
    workflow: any,
    triggerData: any,
    execution: IExecution
  ): Promise<boolean> {
    const stepStartTime = Date.now();

    try {
      // If no conditions, always pass
      if (!workflow.conditions || workflow.conditions.length === 0) {
        return true;
      }

      let allConditionsPass = true;

      for (const condition of workflow.conditions) {
        const conditionPass = await this.evaluateSingleCondition(
          condition,
          triggerData,
          execution
        );

        if (!conditionPass) {
          allConditionsPass = false;
          break;
        }
      }

      // Log condition check step
      execution.steps.push({
        type: StepType.CONDITION_CHECK,
        status: allConditionsPass ? StepStatus.SUCCESS : StepStatus.FAILED,
        input: { conditions: workflow.conditions, triggerData },
        output: { result: allConditionsPass },
        duration: Date.now() - stepStartTime,
        timestamp: new Date(),
      });

      await execution.save();

      return allConditionsPass;
    } catch (error: any) {
      execution.steps.push({
        type: StepType.CONDITION_CHECK,
        status: StepStatus.FAILED,
        input: { conditions: workflow.conditions },
        output: {},
        error: error.message,
        duration: Date.now() - stepStartTime,
        timestamp: new Date(),
      });

      await execution.save();

      throw error;
    }
  }

  // Evaluate single condition
  private async evaluateSingleCondition(
    condition: any,
    triggerData: any,
    execution: IExecution
  ): Promise<boolean> {
    try {
      // Get field value from trigger data
      const fieldValue = this.getFieldValue(triggerData, condition.field);

      switch (condition.operator) {
        case ConditionOperator.EQUALS:
          return fieldValue === condition.value;

        case ConditionOperator.CONTAINS:
          return String(fieldValue)
            .toLowerCase()
            .includes(String(condition.value).toLowerCase());

        case ConditionOperator.GREATER_THAN:
          return Number(fieldValue) > Number(condition.value);

        case ConditionOperator.LESS_THAN:
          return Number(fieldValue) < Number(condition.value);

        case ConditionOperator.MATCHES_INTENT:
          return await this.evaluateIntentCondition(
            fieldValue,
            condition,
            execution
          );

        default:
          logger.warn('Unknown condition operator', {
            operator: condition.operator,
          });
          return false;
      }
    } catch (error) {
      logger.error('Condition evaluation error:', error);
      return false;
    }
  }

  // Evaluate intent-based condition using AI
  private async evaluateIntentCondition(
    text: string,
    condition: any,
    execution: IExecution
  ): Promise<boolean> {
    const stepStartTime = Date.now();

    try {
      // Classify intent using AI
      const aiMetadata = await IntentClassifier.classifyIntent(text);

      // Save AI analysis
      await AIAnalysis.create({
        organizationId: execution.organizationId,
        executionId: execution._id,
        inputText: text,
        detectedIntent: aiMetadata.intent,
        confidence: aiMetadata.confidence,
        reasoning: aiMetadata.reasoning,
        alternativeIntents: [],
        modelUsed: 'claude-sonnet-4-20250514',
        tokensUsed: 500, // Approximate
        latency: Date.now() - stepStartTime,
      });

      // Log AI analysis step
      execution.steps.push({
        type: StepType.AI_ANALYSIS,
        status: StepStatus.SUCCESS,
        input: { text, expectedIntent: condition.value },
        output: { detectedIntent: aiMetadata.intent },
        aiMetadata,
        duration: Date.now() - stepStartTime,
        timestamp: new Date(),
      });

      await execution.save();

      // Check if intent matches
      const intentMatches = aiMetadata.intent === condition.value;

      // Also check if confidence meets threshold
      const meetsConfidence = condition.confidence
        ? aiMetadata.confidence >= condition.confidence
        : true;

      return intentMatches && meetsConfidence;
    } catch (error: any) {
      logger.error('Intent evaluation error:', error);

      execution.steps.push({
        type: StepType.AI_ANALYSIS,
        status: StepStatus.FAILED,
        input: { text },
        output: {},
        error: error.message,
        duration: Date.now() - stepStartTime,
        timestamp: new Date(),
      });

      await execution.save();

      return false;
    }
  }

  // Execute workflow actions
  private async executeActions(
    workflow: any,
    triggerData: any,
    execution: IExecution
  ): Promise<void> {
    // Sort actions by order
    const sortedActions = [...workflow.actions].sort((a, b) => a.order - b.order);

    for (const action of sortedActions) {
      const stepStartTime = Date.now();

      try {
        // Execute action
        const result = await ActionExecutor.execute(
          action,
          triggerData,
          execution.organizationId.toString()
        );

        // Log success
        execution.steps.push({
          type: StepType.ACTION_EXECUTE,
          status: StepStatus.SUCCESS,
          input: { action },
          output: result,
          duration: Date.now() - stepStartTime,
          timestamp: new Date(),
        });

        await execution.save();

        logger.info('Action executed successfully', {
          executionId: execution._id,
          actionType: action.type,
        });
      } catch (error: any) {
        // Log failure but continue with other actions
        execution.steps.push({
          type: StepType.ACTION_EXECUTE,
          status: StepStatus.FAILED,
          input: { action },
          output: {},
          error: error.message,
          duration: Date.now() - stepStartTime,
          timestamp: new Date(),
        });

        await execution.save();

        logger.error('Action execution failed', {
          executionId: execution._id,
          actionType: action.type,
          error: error.message,
        });
      }
    }
  }

  // Get field value from nested object using dot notation
  private getFieldValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Get execution by ID
  async getExecution(executionId: string, organizationId: string) {
    try {
      const execution = await Execution.findOne({
        _id: executionId,
        organizationId,
      }).populate('workflowId', 'name description');

      if (!execution) {
        throw new AppError(404, 'Execution not found');
      }

      return execution;
    } catch (error) {
      logger.error('Get execution error:', error);
      throw error;
    }
  }

  // Get executions for workflow
  async getExecutionsForWorkflow(
    workflowId: string,
    organizationId: string,
    filters: any = {}
  ) {
    try {
      const query: any = { workflowId, organizationId };

      if (filters.status) {
        query.status = filters.status;
      }

      const executions = await Execution.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50)
        .skip(filters.skip || 0);

      const total = await Execution.countDocuments(query);

      return { executions, total };
    } catch (error) {
      logger.error('Get executions error:', error);
      throw error;
    }
  }

  // Cancel running execution
  async cancelExecution(executionId: string, organizationId: string) {
    try {
      const execution = await Execution.findOne({
        _id: executionId,
        organizationId,
      });

      if (!execution) {
        throw new AppError(404, 'Execution not found');
      }

      if (execution.status !== ExecutionStatus.RUNNING) {
        throw new AppError(400, 'Only running executions can be cancelled');
      }

      execution.status = ExecutionStatus.CANCELLED;
      execution.completedAt = new Date();
      execution.duration = Date.now() - execution.startedAt.getTime();
      await execution.save();

      logger.info('Execution cancelled', { executionId });

      return execution;
    } catch (error) {
      logger.error('Cancel execution error:', error);
      throw error;
    }
  }
}

export default new ExecutionEngine();