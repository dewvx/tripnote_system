import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import * as categoriesController from './expense-categories.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', categoriesController.list);

export default router;
