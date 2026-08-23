import Habit from '../models/Habit.model.js';

async function updateHabit(habitId, updates) {
  const oldHabit = await Habit.findById(habitId);
  if (!oldHabit) throw new Error('Habit not found');

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

async function softDeleteHabit(habitId) {
  const habit = await Habit.findByIdAndUpdate(
    habitId,
    { is_active: false, ended_at: new Date() },
    { new: true }
  );
  if (!habit) throw new Error('Habit not found');

  return habit;
}

export { updateHabit, softDeleteHabit };