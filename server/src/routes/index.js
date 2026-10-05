import { Router } from 'express';

import healthRoutes from '../modules/health/health.routes.js';

// รวม router ของทุก module ไว้ใต้ /api
const router = Router();

router.use('/health', healthRoutes);

export default router;
