import { Request, Response } from 'express';
import TriggerHandler from '../services/workflow/TriggerHandler';
import Organization from '../models/Organization';
import { verifyHmacSignature } from '../utils/crypto';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';

export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId, workflowId } = req.params;
  const signature = req.headers['x-workflow-signature'] as string;

  // Verify organization exists
  const organization = await Organization.findById(organizationId);
  if (!organization) {
    throw new AppError(404, 'Organization not found');
  }

  // Verify signature if provided
  if (signature) {
    const isValid = verifyHmacSignature(
      JSON.stringify(req.body),
      signature,
      organization.settings.webhookSecret
    );

    if (!isValid) {
      throw new AppError(401, 'Invalid webhook signature');
    }
  }

  // Handle webhook trigger
  await TriggerHandler.handleWebhook(workflowId, organizationId, req.body);

  res.json({
    success: true,
    message: 'Webhook received and queued',
  });
});