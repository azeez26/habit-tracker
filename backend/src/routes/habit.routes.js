import express from 'express';
import { createHabit, editHabit, deleteHabit, getHabitsByDay, getHabitHistory } from '../controllers/habit.controller.js';
import { logHabit, getHabitLogs } from '../controllers/habitLog.controller.js';
import { protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { createHabitSchema, updateHabitSchema, logHabitSchema } from '../validations/habit.schema.js';

const router = express.Router();

router.use(protect);

router.post('/', validateRequest(createHabitSchema), createHabit);
router.put('/:id', validateRequest(updateHabitSchema), editHabit);
router.delete('/:id', deleteHabit);
router.get('/day/:date', getHabitsByDay);


router.post('/:habitId/log', validateRequest(logHabitSchema), logHabit);
router.get('/:habitId/logs', getHabitLogs);

router.get('/:id/history', getHabitHistory);

export default router;
