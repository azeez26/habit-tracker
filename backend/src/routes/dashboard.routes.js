import express from 'express';
import { getDashboardStats, getMonthStats, getMonthDailyStats } from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getDashboardStats);
router.get('/month', getMonthStats);
router.get('/month/daily', getMonthDailyStats);

export default router;