import { Router } from 'express';

import authRoutes from '../modules/auth/auth.routes.js';
import healthRoutes from '../modules/health/health.routes.js';
import tripsRoutes from '../modules/trips/trips.routes.js';
import usersRoutes from '../modules/users/users.routes.js';

// รวม router ของทุก module ไว้ใต้ /api
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/trips', tripsRoutes);

export default router;
