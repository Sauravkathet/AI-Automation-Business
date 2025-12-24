import { Router } from 'express';
import * as workflowController from '../controllers/workflowController';
import { authenticate } from '../middleware/auth';
import { ensureTenancy } from '../middleware/tenancy';
import { requireMember, requireAdmin } from '../middleware/rbac';
import { validate } from '../middleware/validation';
import { workflowSchema } from '../utils/validators';
import { aiLimiter } from '../middleware/rateLimiter';
import Joi from 'joi';

const router = Router();

// All routes require authentication and tenancy
router.use(authenticate);
router.use(ensureTenancy);

// Parse natural language workflow (AI)
router.post(
  '/parse',
  requireMember,
  aiLimiter,
  validate(
    Joi.object({
      naturalLanguage: Joi.string().min(10).max(1000).required(),
      name: Joi.string().min(3).max(100).optional(),
    })
  ),
  workflowController.createFromNaturalLanguage
);

// CRUD operations
router.post(
  '/',
  requireMember,
  validate(workflowSchema),
  workflowController.createManual
);

router.get('/', workflowController.getAll);

router.get('/:id', workflowController.getById);

router.patch('/:id', requireMember, workflowController.update);

router.delete('/:id', requireAdmin, workflowController.deleteWorkflow);

// Workflow actions
router.post('/:id/approve', requireAdmin, workflowController.approve);

router.post('/:id/activate', requireAdmin, workflowController.activate);

router.post('/:id/pause', requireAdmin, workflowController.pause);

router.post('/:id/execute', requireMember, workflowController.executeManual);

// Executions
router.get('/:id/executions', workflowController.getExecutions);

export default router;