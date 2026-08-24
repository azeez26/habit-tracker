import express from 'express';
import { createHabit, editHabit, deleteHabit, getHabitsByDay } from '../controllers/habit.controller.js';
import { protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { createHabitSchema, updateHabitSchema } from '../validations/habit.schema.js';

const router = express.Router();

router.use(protect);

router.post('/', validateRequest(createHabitSchema), createHabit);
router.put('/:id', validateRequest(updateHabitSchema), editHabit);
router.delete('/:id', deleteHabit);
router.get('/day/:date', getHabitsByDay);

export default router;
