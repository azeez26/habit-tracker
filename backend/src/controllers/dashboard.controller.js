import Habit from "../models/Habit.model.js";
import HabitLog from "../models/HabitLog.model.js";
import catchAsync from "../utils/catchAsync.js";
import {
  getTodayInTimezone,
  getLocalDayOfWeek,
} from "../utils/timezoneUtils.js";

/**
 * GET /api/dashboard
 * Returns overview stats for today
 */
export const getDashboardStats = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const timezone = req.user.timezone;
  const today = getTodayInTimezone(timezone);
  const dayOfWeek = getLocalDayOfWeek(today, timezone);

  // Get all active habits
  const allHabits = await Habit.find({
    user_id: userId,
    is_active: true,
    $or: [{ ended_at: null }, { ended_at: { $gt: new Date() } }],
  });

  // Get today's habits scheduled for this day
  const todayHabits = allHabits.filter((h) => h.days.includes(dayOfWeek));

  // Get today's logs
  const todayLogs = await HabitLog.find({
    user_id: userId,
    date: today,
  });

  const logMap = todayLogs.reduce((acc, log) => {
    acc[log.habit_id.toString()] = log;
    return acc;
  }, {});

  // Calculate summary
  const completedCount = todayLogs.filter((l) => l.status === "done").length;
  const missedCount = todayLogs.filter((l) => l.status === "missed").length;
  const pendingCount = todayHabits.length - todayLogs.length;

  // Calculate total best streak
  const totalBestStreak = allHabits.reduce(
    (sum, h) => sum + (h.stats?.best_streak || 0),
    0,
  );
  const totalCompletions = allHabits.reduce(
    (sum, h) => sum + (h.stats?.total_completions || 0),
    0,
  );

  res.status(200).json({
    success: true,
    data: {
      today,
      timezone,
      summary: {
        total_habits: todayHabits.length,
        completed: completedCount,
        missed: missedCount,
        pending: pendingCount,
        completion_rate:
          todayHabits.length > 0
            ? Math.round((completedCount / todayHabits.length) * 100)
            : 0,
      },
      overall: {
        total_habits: allHabits.length,
        total_best_streak: totalBestStreak,
        total_completions: totalCompletions,
      },
      habits: todayHabits.map((habit) => ({
        id: habit._id,
        name: habit.name,
        goal_type: habit.goal_type,
        goal_target: habit.goal_target,
        status: logMap[habit._id.toString()]?.status || "pending",
        progress_value: logMap[habit._id.toString()]?.progress_value || 0,
        stats: habit.stats,
      })),
    },
  });
});

/**
 * GET /api/dashboard/month?month=2026-08
 * Returns monthly overview
 */
export const getMonthStats = catchAsync(async (req, res, next) => {
  const { month } = req.query; // "2026-08"
  const userId = req.user._id;

  if (!month || !month.match(/^\d{4}-\d{2}$/)) {
    return next(new AppError("Month format should be YYYY-MM", 400));
  }

  // Get all logs for the month
  const monthLogs = await HabitLog.find({
    user_id: userId,
    date: { $regex: `^${month}` },
  }).lean();

  // Group by habit
  const habitStats = {};

  monthLogs.forEach((log) => {
    if (!habitStats[log.habit_id.toString()]) {
      habitStats[log.habit_id.toString()] = {
        completed: 0,
        missed: 0,
        total: 0,
      };
    }

    habitStats[log.habit_id.toString()].total++;
    if (log.status === "done") {
      habitStats[log.habit_id.toString()].completed++;
    } else {
      habitStats[log.habit_id.toString()].missed++;
    }
  });

  // Get habit details
  const habits = await Habit.find({
    user_id: userId,
    is_active: true,
  });

  const result = habits.map((h) => {
    const stats = habitStats[h._id.toString()] || {
      completed: 0,
      missed: 0,
      total: 0,
    };
    return {
      id: h._id,
      name: h.name,
      completed: stats.completed,
      missed: stats.missed,
      total: stats.total,
      completion_rate:
        stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    };
  });

  res.status(200).json({
    success: true,
    month,
    data: result,
  });
});
