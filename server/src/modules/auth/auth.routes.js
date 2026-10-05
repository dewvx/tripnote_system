import { Router } from 'express';

import { authLimiter, sessionLimiter } from '../../middlewares/rateLimit.js';
import { validate } from '../../middlewares/validate.js';
import * as authController from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schema.js';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), authController.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
router.post('/refresh', sessionLimiter, authController.refresh);
router.post('/logout', sessionLimiter, authController.logout);

export default router;
