const { HabitOccurrence } = require('../models/HabitOccurrence.model.js');

function toOurDayOfWeek(jsDate) {
  return (jsDate.getDay() + 1) % 7;
}

function formatDate(jsDate) {
  const y = jsDate.getFullYear();
  const m = String(jsDate.getMonth() + 1).padStart(2, '0');
  const d = String(jsDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}



async function generateOccurrences(habit, fromDate = new Date()) {
  const year = fromDate.getFullYear();
  const month = fromDate.getMonth(); // 0-indexed
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  const target =
    habit.goal_type === 'duration'
      ? habit.goal_duration_seconds
      : habit.goal_count_target;

  const operations = [];

  for (let day = fromDate.getDate(); day <= lastDayOfMonth; day++) {
    const currentDate = new Date(year, month, day);
    const dayOfWeek = toOurDayOfWeek(currentDate);

    const scheduleDay = habit.schedule.days.find(
      (d) => d.day_of_week === dayOfWeek
    );
    if (!scheduleDay || !scheduleDay.is_checked) continue; 

    const scheduledTime = habit.schedule.fixed_time_for_all_days
      ? habit.schedule.default_time
      : scheduleDay.time;

    operations.push({
      updateOne: {
        filter: {
          habit_id: habit._id,
          scheduled_date: formatDate(currentDate),
        },
        update: {
          $setOnInsert: {
            habit_id: habit._id,
            user_id: habit.user_id,
            scheduled_date: formatDate(currentDate),
            scheduled_time: scheduledTime,
            status: 'pending',
            goal_progress: {
              type: habit.goal_type,
              target,
              completed: 0,
            },
          },
        },
        upsert: true,
      },
    });
  }

  if (operations.length === 0) return { generated: 0 };

  const result = await HabitOccurrence.bulkWrite(operations);
  return { generated: result.upsertedCount };
}



async function deleteFuturePendingOccurrences(habitId, fromDate = new Date()) {
  const fromDateStr = formatDate(fromDate);
  const result = await HabitOccurrence.deleteMany({
    habit_id: habitId,
    scheduled_date: { $gte: fromDateStr },
    status: 'pending',
  });
  return { deleted: result.deletedCount };
}

module.exports = { generateOccurrences, deleteFuturePendingOccurrences };