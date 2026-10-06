import { Router } from 'express';

import authRoutes from '../modules/auth/auth.routes.js';
import expenseCategoriesRoutes from '../modules/expense-categories/expense-categories.routes.js';
import expensesRoutes from '../modules/expenses/expenses.routes.js';
import healthRoutes from '../modules/health/health.routes.js';
import tripsRoutes from '../modules/trips/trips.routes.js';
import usersRoutes from '../modules/users/users.routes.js';

// รวม router ของทุก module ไว้ใต้ /api
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/expense-categories', expenseCategoriesRoutes);
// ทรัพยากรย่อยของทริปต้อง mount ก่อน /trips ไม่งั้นคำขอจะวิ่งผ่าน router ของ trips ก่อนโดยไม่จำเป็น
router.use('/trips/:tripId/expenses', expensesRoutes);
router.use('/trips', tripsRoutes);

export default router;
