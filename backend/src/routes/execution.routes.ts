import { Router } from 'express';
import * as executionController from '../controllers/executionController';
import { authenticate } from '../middleware/auth';
import { ensureTenancy } from '../middleware/tenancy';

const router = Router();

router.use(authenticate);
router.use(ensureTenancy);

router.get('/', executionController.getAll);

router.get('/:id', executionController.getById);

router.post('/:id/cancel', executionController.cancel);

router.get('/:id/logs', executionController.getLogs);

export default router;