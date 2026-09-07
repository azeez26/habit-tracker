import Habit from "../models/Habit.model.js";
import HabitLog from "../models/HabitLog.model.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import {
  getTodayInTimezone,
  getLocalDayOfWeek,
} from "../utils/dateUtils.js"; 

/**
 * GET /api/dashboard
 * Returns overview stats for today
 * 
 * Improvements:
 * maxBestStreak: أطول سلسلة متصلة (مش مجموع وهمي)
 * totalCompletions: يحسب إجمالي المرات فعلاً
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

  // IMPROVEMENT 1: maxBestStreak instead of sum
  // يرجع أطول سلسلة متصلة (أكبر إنجاز)
  const maxBestStreak = allHabits.length > 0
    ? Math.max(...allHabits.map((h) => h.stats?.best_streak || 0))
    : 0;

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
        max_best_streak: maxBestStreak, 
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
 * Returns monthly overview grouped by habit
 * 
 * Improvement:
 * Using date range ($gte, $lte) instead of regex for better indexing performance
 */
export const getMonthStats = catchAsync(async (req, res, next) => {
  const { month } = req.query; // "2026-08"
  const userId = req.user._id;

  if (!month || !month.match(/^\d{4}-\d{2}$/)) {
    return next(new AppError("Month format should be YYYY-MM", 400));
  }

  // IMPROVEMENT 2: Use date range instead of regex
  // هذا أسرع للـ database والـ indexing يشتغل أحسن
  const [year, monthNum] = month.split("-");
  const firstDay = `${year}-${monthNum}-01`;
  const lastDay = `${year}-${monthNum}-31`; // MongoDB يتعامل معها تمام
  
  // Get all logs for the month using range query
  const monthLogs = await HabitLog.find({
    user_id: userId,
    date: {
      $gte: firstDay,
      $lte: lastDay,
    },
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

/**
 * GET /api/dashboard/month/daily?month=2026-08
 * Returns monthly overview grouped by day (for heatmap/calendar view)
 * 
 * IMPROVEMENT 3: New endpoint for daily aggregation
 * مفيدة لـ Heatmap أو Calendar UI
 */
export const getMonthDailyStats = catchAsync(async (req, res, next) => {
  const { month } = req.query; // "2026-08"
  const userId = req.user._id;

  if (!month || !month.match(/^\d{4}-\d{2}$/)) {
    return next(new AppError("Month format should be YYYY-MM", 400));
  }

  const [year, monthNum] = month.split("-");
  const firstDay = `${year}-${monthNum}-01`;
  const lastDay = `${year}-${monthNum}-31`;

  // Get all logs for the month
  const monthLogs = await HabitLog.find({
    user_id: userId,
    date: {
      $gte: firstDay,
      $lte: lastDay,
    },
  }).lean();

  // Group by date (for heatmap)
  const dailyStats = {};

  monthLogs.forEach((log) => {
    if (!dailyStats[log.date]) {
      dailyStats[log.date] = {
        total_habits_scheduled: 0,
        completed: 0,
        missed: 0,
        pending: 0,
        completion_rate: 0,
      };
    }

    if (log.status === "done") {
      dailyStats[log.date].completed++;
    } else if (log.status === "missed") {
      dailyStats[log.date].missed++;
    }
  });

  // Calculate completion rate for each day
  const result = Object.keys(dailyStats)
    .sort()
    .map((date) => {
      const stats = dailyStats[date];
      const total = stats.completed + stats.missed;
      stats.total_habits_logged = total;
      stats.completion_rate =
        total > 0 ? Math.round((stats.completed / total) * 100) : 0;
      return {
        date,
        ...stats,
      };
    });

  res.status(200).json({
    success: true,
    month,
    data: result,
  });
});