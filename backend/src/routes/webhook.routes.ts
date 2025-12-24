import { Router } from 'express';
import * as webhookController from '../controllers/webhookController';
import { webhookLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post(
  '/:organizationId/:workflowId',
  webhookLimiter,
  webhookController.handleWebhook
);

export default router;