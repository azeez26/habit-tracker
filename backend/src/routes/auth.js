import express from 'express';
import {
    register,
    login,
    me,
    updateProfile
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../validations/auth.schema.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();


router.post('/register', validateRequest(registerSchema), register);
router.post('/login', loginLimiter, validateRequest(loginSchema), login);
router.get('/me', protect, me);
router.put('/update', protect, validateRequest(updateProfileSchema), updateProfile);

export default router;