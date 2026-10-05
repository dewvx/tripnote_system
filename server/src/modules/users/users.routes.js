import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import * as usersController from './users.controller.js';

const router = Router();

router.use(authenticate);

router.get('/me', usersController.getMe);

export default router;
