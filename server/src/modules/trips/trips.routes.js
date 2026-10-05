import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { requireTripRole } from '../../middlewares/requireTripRole.js';
import { validate } from '../../middlewares/validate.js';
import * as tripsController from './trips.controller.js';
import {
  createTripSchema,
  listTripsQuerySchema,
  updateStatusSchema,
  updateTripSchema,
} from './trips.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', validate({ query: listTripsQuerySchema }), tripsController.list);
router.post('/', validate({ body: createTripSchema }), tripsController.create);

router.get('/:tripId', requireTripRole('viewer'), tripsController.get);
router.patch(
  '/:tripId',
  requireTripRole('owner'),
  validate({ body: updateTripSchema }),
  tripsController.update,
);
router.patch(
  '/:tripId/status',
  requireTripRole('owner'),
  validate({ body: updateStatusSchema }),
  tripsController.updateStatus,
);

router.delete('/:tripId', requireTripRole('owner'), tripsController.remove);

export default router;
