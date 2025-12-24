import { Router } from 'express';
import * as organizationController from '../controllers/organizationController';
import { authenticate } from '../middleware/auth';
import { ensureTenancy } from '../middleware/tenancy';
import { requireAdmin, requireOwner } from '../middleware/rbac';
import { validate } from '../middleware/validation';
import Joi from 'joi';

const router = Router();

router.use(authenticate);
router.use(ensureTenancy);

router.get('/current', organizationController.getCurrent);

router.patch(
  '/current',
  requireOwner,
  validate(
    Joi.object({
      name: Joi.string().min(2).max(100).optional(),
      settings: Joi.object({
        aiConfidenceThreshold: Joi.number().min(0).max(1).optional(),
        requireApproval: Joi.boolean().optional(),
      }).optional(),
    })
  ),
  organizationController.update
);

router.get('/members', organizationController.getMembers);

router.post(
  '/invite',
  requireAdmin,
  validate(
    Joi.object({
      email: Joi.string().email().required(),
      role: Joi.string()
        .valid('admin', 'member', 'viewer')
        .required(),
    })
  ),
  organizationController.inviteMember
);

router.delete('/members/:userId', requireOwner, organizationController.removeMember);

router.patch(
  '/members/:userId/role',
  requireOwner,
  validate(
    Joi.object({
      role: Joi.string()
        .valid('admin', 'member', 'viewer')
        .required(),
    })
  ),
  organizationController.updateMemberRole
);

export default router;