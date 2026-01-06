import { Request, Response } from 'express';
import WorkflowService from '../services/workflow/WorkflowService';
import ExecutionEngine from '../services/workflow/ExecutionEngine';
import TriggerHandler from '../services/workflow/TriggerHandler';
import { asyncHandler } from '../middleware/errorHandler';

export const createFromNaturalLanguage = asyncHandler(
  async (req: Request, res: Response) => {
    const { naturalLanguage, name } = req.body;
    const organizationId = req.organizationId!;
    const userId = req.user!._id.toString();

    const result = await WorkflowService.createFromNaturalLanguage(
      organizationId,
      userId,
      naturalLanguage,
      name
    );

    res.status(201).json({
      success: true,
      message: result.requiresApproval
        ? 'Workflow created and requires approval'
        : 'Workflow created and activated',
      data: result,
    });
  }
);

export const createManual = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.organizationId!;
  const userId = req.user!._id.toString();

  const workflow = await WorkflowService.createManual(
    organizationId,
    userId,
    req.body
  );

  res.status(201).json({
    success: true,
    message: 'Workflow created successfully',
    data: { workflow },
  });
});

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.organizationId!;
  const { status, createdBy, limit, skip } = req.query;

  const result = await WorkflowService.getAll(organizationId, {
    status,
    createdBy,
    limit: limit ? parseInt(limit as string) : undefined,
    skip: skip ? parseInt(skip as string) : undefined,
  });

  res.json({
    success: true,
    data: result,
  });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.organizationId!;

  const workflow = await WorkflowService.getById(id, organizationId);

  res.json({
    success: true,
    data: { workflow },
  });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.organizationId!;

  const workflow = await WorkflowService.update(id, organizationId, req.body);

  res.json({
    success: true,
    message: 'Workflow updated successfully',
    data: { workflow },
  });
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.organizationId!;
  const userId = req.user!._id.toString();

  const workflow = await WorkflowService.approve(id, organizationId, userId);

  res.json({
    success: true,
    message: 'Workflow approved and activated',
    data: { workflow },
  });
});

export const activate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.organizationId!;

  const workflow = await WorkflowService.activate(id, organizationId);

  res.json({
    success: true,
    message: 'Workflow activated',
    data: { workflow },
  });
});

export const pause = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.organizationId!;

  const workflow = await WorkflowService.pause(id, organizationId);

  res.json({
    success: true,
    message: 'Workflow paused',
    data: { workflow },
  });
});

export const deleteWorkflow = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;

    await WorkflowService.delete(id, organizationId);

    res.json({
      success: true,
      message: 'Workflow deleted',
    });
  }
);

export const executeManual = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.organizationId!;

  await TriggerHandler.handleManual(id, organizationId, req.body);

  res.json({
    success: true,
    message: 'Workflow execution queued',
  });
});

export const getExecutions = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.organizationId!;
  const { status, limit, skip } = req.query;

  const result = await ExecutionEngine.getExecutionsForWorkflow(
    id,
    organizationId,
    {
      status,
      limit: limit ? parseInt(limit as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined,
    }
  );

  res.json({
    success: true,
    data: result,
  });
});