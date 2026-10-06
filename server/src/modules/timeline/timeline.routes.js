import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { requireTripRole } from '../../middlewares/requireTripRole.js';
import * as timelineController from './timeline.controller.js';

// mergeParams: อ่าน :tripId จาก path ที่ mount ไว้ใน routes/index.js
const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', requireTripRole('viewer'), timelineController.get);

export default router;
