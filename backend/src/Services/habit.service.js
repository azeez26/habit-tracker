import Habit from '../models/Habit.model.js';

async function updateHabit(habitId, userId, updates) {
  const oldHabit = await Habit.findOne({ _id: habitId, user_id: userId, is_active: true });
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

export { updateHabit, softDeleteHabit };