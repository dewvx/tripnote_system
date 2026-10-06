import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { requireTripRole } from '../../middlewares/requireTripRole.js';
import { validate } from '../../middlewares/validate.js';
import * as expensesController from './expenses.controller.js';
import {
  createExpenseSchema,
  expenseParamsSchema,
  listExpensesQuerySchema,
  updateExpenseSchema,
} from './expenses.schema.js';

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
router.patch(
  '/:expenseId',
  requireTripRole('editor'),
  validate({ params: expenseParamsSchema, body: updateExpenseSchema }),
  expensesController.update,
);
router.delete(
  '/:expenseId',
  requireTripRole('editor'),
  validate({ params: expenseParamsSchema }),
  expensesController.remove,
);

export default router;
