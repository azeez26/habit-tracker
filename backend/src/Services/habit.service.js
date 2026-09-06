import Habit from "../models/Habit.model.js";
import habitLog from "../models/HabitLog.model.js";
import { parseISO, addDays, isBefore } from "date-fns";

async function updateHabit(habitId, userId, updates) {
  const oldHabit = await Habit.findOne({
    _id: habitId,
    user_id: userId,
    is_active: true,
  });
  if (!oldHabit) return null;

  oldHabit.is_active = false;
  oldHabit.ended_at = new Date();
  await oldHabit.save();

  const newHabitData = {
    ...oldHabit.toObject(),
    ...updates,
    parent_habit_id: oldHabit._id,
    root_habit_id: oldHabit.root_habit_id || oldHabit._id,
    ended_at: null,
    is_active: true,
  };

  delete newHabitData._id;
  delete newHabitData.created_at;
  delete newHabitData.updated_at;
  delete newHabitData.__v;

  const newHabit = new Habit(newHabitData);
  await newHabit.save();

  return newHabit;
}

async function softDeleteHabit(habitId, userId) {
  const habit = await Habit.findOneAndUpdate(
    { _id: habitId, user_id: userId, is_active: true },
    { is_active: false, ended_at: new Date() },
    { new: true },
  );
  if (!habit) return null;

  return habit;
}

export async function recalculateStreaks(habitId, userId) {
  try {
    const habit = await Habit.findOne({
      _id: habitId,
      user_id: userId,
    });

    if (!habit) {
      console.error(`Habit ${habitId} not found`);
      return;
    }

    // Get all logs for this habit, sorted by date DESC
    const logs = await HabitLog.find({
      habit_id: habitId,
      user_id: userId,
    })
      .sort({ date: -1 })
      .lean();

    if (logs.length === 0) {
      // No logs yet - reset stats
      habit.stats = {
        current_streak: 0,
        best_streak: 0,
        total_completions: 0,
        last_completed: null,
      };
      await habit.save();
      return;
    }

    // Get unique dates from logs (deduplicate if multiple timezones)
    const dateLogsMap = {};
    logs.forEach((log) => {
      if (!dateLogsMap[log.date]) {
        dateLogsMap[log.date] = log;
      }
    });

    const sortedDates = Object.keys(dateLogsMap).sort().reverse();
    const sortedLogs = sortedDates.map((d) => dateLogsMap[d]);

    // Calculate streaks
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let totalCompletions = 0;
    let lastCompletedDate = null;

    for (let i = 0; i < sortedLogs.length; i++) {
      const log = sortedLogs[i];

      if (log.status === "done") {
        tempStreak++;
        totalCompletions++;
        if (!lastCompletedDate) {
          lastCompletedDate = log.date;
        }
      } else if (log.status === "missed") {
        if (i === 0) {
          // Current day is missed, streak is 0
          currentStreak = 0;
        } else if (i > 0 && sortedLogs[i - 1].status === "done") {
          // Streak ended
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 0;
        }
      }
    }

    // Last streak
    currentStreak = sortedLogs[0].status === "done" ? tempStreak : 0;
    bestStreak = Math.max(bestStreak, tempStreak);

    // Update habit with new stats
    habit.stats = {
      current_streak: currentStreak,
      best_streak: bestStreak,
      total_completions: totalCompletions,
      last_completed: lastCompletedDate,
    };

    await habit.save();
    console.log(`Streaks updated for habit ${habitId}:`, habit.stats);
  } catch (error) {
    console.error(`Error calculating streaks for habit ${habitId}:`, error);
  }
}

export { updateHabit, softDeleteHabit };
