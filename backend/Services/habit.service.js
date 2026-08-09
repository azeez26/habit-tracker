const { Habit } = require('../models/Habit.model');
const {
  generateOccurrences,
  deleteFuturePendingOccurrences,
} = require('./occurrence.service');


async function updateHabit(habitId, updates) {
  const habit = await Habit.findByIdAndUpdate(habitId, updates, {
    new: true,
    runValidators: true,
  });
  if (!habit) throw new Error('Habit not found');

  await deleteFuturePendingOccurrences(habit._id);
  await generateOccurrences(habit);

  return habit;
}


async function softDeleteHabit(habitId) {
  const habit = await Habit.findByIdAndUpdate(
    habitId,
    { is_active: false },
    { new: true }
  );
  if (!habit) throw new Error('Habit not found');

  await deleteFuturePendingOccurrences(habit._id);

  return habit;
}

module.exports = { updateHabit, softDeleteHabit };