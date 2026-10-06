import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { requireTripRole } from '../../middlewares/requireTripRole.js';
import { validate } from '../../middlewares/validate.js';
import * as expensesController from './expenses.controller.js';
import { createExpenseSchema, listExpensesQuerySchema } from './expenses.schema.js';

// mergeParams: อ่าน :tripId จาก path ที่ mount ไว้ใน routes/index.js
const router = Router({ mergeParams: true });

router.use(authenticate);

router.get(
  '/',
  requireTripRole('viewer'),
  validate({ query: listExpensesQuerySchema }),
  expensesController.list,
);
router.post(
  '/',
  requireTripRole('editor'),
  validate({ body: createExpenseSchema }),
  expensesController.create,
);

export default router;
