import { Request, Response } from 'express';
import ExecutionEngine from '../services/workflow/ExecutionEngine';
import Execution from '../models/Execution';
import { asyncHandler } from '../middleware/errorHandler';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.organizationId!;
  const { status, workflowId, limit, skip } = req.query;

  const query: any = { organizationId };

  if (status) query.status = status;
  if (workflowId) query.workflowId = workflowId;

  const executions = await Execution.find(query)
    .populate('workflowId', 'name description')
    .sort({ createdAt: -1 })
    .limit(limit ? parseInt(limit as string) : 50)
    .skip(skip ? parseInt(skip as string) : 0);

  const total = await Execution.countDocuments(query);

  res.json({
    success: true,
    data: { executions, total },
  });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.organizationId!;

  const execution = await ExecutionEngine.getExecution(id, organizationId);

  res.json({
    success: true,
    data: { execution },
  });
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.organizationId!;

  const execution = await ExecutionEngine.cancelExecution(id, organizationId);

  res.json({
    success: true,
    message: 'Execution cancelled',
    data: { execution },
  });
});

export const getLogs = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.organizationId!;

  const execution = await ExecutionEngine.getExecution(id, organizationId);

  res.json({
    success: true,
    data: {
      logs: execution.steps,
      executionId: execution._id,
      status: execution.status,
    },
  });
});