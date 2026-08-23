import express from 'express';
import { createHabit, editHabit, getHabitsByDay } from '../controllers/habit.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createHabit);
router.put('/:id', editHabit);
router.get('/day/:date', getHabitsByDay);

export default router;
