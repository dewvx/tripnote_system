import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { requireTripRole } from '../../middlewares/requireTripRole.js';
import { validate } from '../../middlewares/validate.js';
import * as journalController from './journal.controller.js';
import { createEntrySchema, entryParamsSchema, updateEntrySchema } from './journal.schema.js';

// mergeParams: อ่าน :tripId จาก path ที่ mount ไว้ใน routes/index.js
// อ่านบันทึกผ่าน /timeline ใน v0.1 จึงยังไม่มี GET รายการและ GET ตัวเดียว
const router = Router({ mergeParams: true });

router.use(authenticate);

router.post(
  '/',
  requireTripRole('editor'),
  validate({ body: createEntrySchema }),
  journalController.create,
);
router.patch(
  '/:entryId',
  requireTripRole('editor'),
  validate({ params: entryParamsSchema, body: updateEntrySchema }),
  journalController.update,
);
router.delete(
  '/:entryId',
  requireTripRole('editor'),
  validate({ params: entryParamsSchema }),
  journalController.remove,
);

export default router;
