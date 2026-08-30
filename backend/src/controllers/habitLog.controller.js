import HabitLog from '../models/HabitLog.model.js';
import Habit from '../models/Habit.model.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { getTodayInTimezone } from '../utils/dateUtils.js';

/**
 * Log or update habit status for a specific date
 * POST /api/habits/:habitId/log
 * 
 * Body: {
 *   date: "2026-08-26",
 *   status: "done" or "missed",
 *   progress_value: 50 (optional)
 * }
 */
export const logHabit = catchAsync(async (req, res, next) => {
  const { habitId } = req.params;
  const { date, status, progress_value } = req.body;
  const userId = req.user._id;
  const timezone = req.user.timezone;

  if (!habitId) {
    return next(new AppError('Habit ID required', 400));
  }
  if (!date || !status) {
    return next(new AppError('Date and status required', 400));
  }
  
  const habit = await Habit.findOne({ 
    _id: habitId, 
    user_id: userId,
    is_active: true 
  });
  
  if (!habit) {
    return next(new AppError('Habit not found', 404));
  }
  
  // Check progress doesn't exceed goal
  if (progress_value && progress_value > habit.goal_target) {
    return next(new AppError(`Progress cannot exceed goal (${habit.goal_target})`, 400));
  }
  
  // Upsert log (update if exists, create if not)
  const log = await HabitLog.findOneAndUpdate(
    { 
      habit_id: habitId, 
      user_id: userId, 
      date: date,
      timezone: timezone 
    },
    { 
      status, 
      progress_value: progress_value || 0,
      logged_at: new Date()
    },
    { upsert: true, new: true, runValidators: true }
  );
  
  // Recalculate streaks asynchronously (don't wait)
  recalculateStreaks(habitId, userId).catch(err => console.error('Streak calc failed:', err));
  
  res.status(200).json({ 
    success: true, 
    data: log,
    message: 'Habit logged successfully'
  });
});

/**
 * Get all logs for a specific habit
 * GET /api/habits/:habitId/logs?fromDate=2026-01-01&toDate=2026-08-31
 */
export const getHabitLogs = catchAsync(async (req, res, next) => {
  const { habitId } = req.params;
  const { fromDate, toDate } = req.query;
  const userId = req.user._id;
  
  const habit = await Habit.findOne({ _id: habitId, user_id: userId });
  if (!habit) {
    return next(new AppError('Habit not found', 404));
  }
  
  const query = { habit_id: habitId, user_id: userId };
  
  if (fromDate || toDate) {
    query.date = {};
    if (fromDate) query.date.$gte = fromDate;
    if (toDate) query.date.$lte = toDate;
  }
  
  const logs = await HabitLog.find(query).sort({ date: -1 });
  
  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs
  });
});