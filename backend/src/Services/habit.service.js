import Habit from "../models/Habit.model.js";
import HabitLog from "../models/HabitLog.model.js";
import { parseISO, addDays, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { getLocalDayOfWeek } from "../utils/dateUtils.js";

async function markMissedOccurrences(habit, userId, timezone) {
  const now = new Date();

  // Convert habit creation date to user's local date
  const localCreatedDate = format(
    toZonedTime(habit.created_at, timezone),
    "yyyy-MM-dd"
  );

  // Yesterday in user's timezone
  const localYesterday = format(
    toZonedTime(addDays(now, -1), timezone),
    "yyyy-MM-dd"
  );

  let currentDate = parseISO(localCreatedDate);
  const endDate = parseISO(localYesterday);

  while (currentDate <= endDate) {
    const dateString = format(currentDate, "yyyy-MM-dd");

    const dayOfWeek = getLocalDayOfWeek(dateString, timezone);

    // Ignore days that are not scheduled
    if (habit.days.includes(dayOfWeek)) {
      await HabitLog.updateOne(
        {
          habit_id: habit._id,
          user_id: userId,
          date: dateString,
          timezone,
        },
        {
          $setOnInsert: {
            status: "missed",
            progress_value: 0,
            logged_at: new Date(),
          },
        },
        { upsert: true }
      );
    }

    currentDate = addDays(currentDate, 1);
  }
}

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
    { new: true }
  );

  if (!habit) return null;

  return habit;
}

export async function recalculateStreaks(habitId, userId, timezone) {
  try {
    const habit = await Habit.findOne({
      _id: habitId,
      user_id: userId,
    });

    if (!habit) {
      console.error(`Habit ${habitId} not found`);
      return;
    }

    // Make sure all past scheduled occurrences have a log
    await markMissedOccurrences(habit, userId, timezone);

    const logs = await HabitLog.find({
      habit_id: habitId,
      user_id: userId,
      timezone,
    })
      .sort({ date: 1 })
      .lean();

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let totalCompletions = 0;
    let lastCompletedDate = null;

    for (const log of logs) {
      if (log.status === "done") {
        tempStreak++;
        totalCompletions++;

        lastCompletedDate = log.date;

        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Current streak is the streak at the end of the logs
    currentStreak = tempStreak;

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

export { updateHabit, softDeleteHabit, markMissedOccurrences };