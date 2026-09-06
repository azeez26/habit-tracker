import express from 'express';
import { getDashboardStats, getMonthStats } from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getDashboardStats);
router.get('/month', getMonthStats);

export default router;