import Habit from '../models/Habit.model.js';
import HabitLog from '../models/HabitLog.model.js';
import { updateHabit, softDeleteHabit } from '../Services/habit.service.js';
import { parseISO, startOfDay, isBefore } from 'date-fns';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { getLocalDayOfWeek } from '../utils/dateUtils.js';

export const createHabit = catchAsync(async (req, res, next) => {
  const { name, goal_type, goal_target, days, time } = req.body;
  if (!name || !goal_type || goal_target === undefined || !days) {
    return next(new AppError('Please provide all required fields', 400));
  }

  const habit = new Habit({
    user_id: req.user.id,
    name,
    goal_type,
    goal_target,
    days,
    time,
  });
  await habit.save();
  res.status(201).json({ success: true, data: habit });
});

export const editHabit = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return next(new AppError('Please provide habit id', 400));
  }

  const clonedHabit = await updateHabit(id, req.user.id, req.body);
  if (!clonedHabit) {
    return next(new AppError('Habit not found', 404));
  }

  res.status(200).json({ success: true, data: clonedHabit });
});

export const deleteHabit = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return next(new AppError('Please provide habit id', 400));
  }

  const habit = await softDeleteHabit(id, req.user.id);
  if (!habit) {
    return next(new AppError('Habit not found', 404));
  }

  res.status(200).json({ success: true, data: habit });
});

export const getHabitsByDay = catchAsync(async (req, res, next) => {
  const { date } = req.params; // 'YYYY-MM-DD'
  
  if (!date) {
    return next(new AppError('Please provide a date', 400));
  }

  const reqDateObj = parseISO(date);
  const dayOfWeek = getLocalDayOfWeek(date);
  
  const nextDayObj = new Date(reqDateObj.getTime() + 24 * 60 * 60 * 1000);

  const habits = await Habit.find({
    user_id: req.user.id,
    days: { $in: [dayOfWeek] },
    created_at: { $lt: nextDayObj },
    $or: [
      { ended_at: null },
      { ended_at: { $gt: reqDateObj } }
    ]
  });
  
  const habitIds = habits.map(h => h._id);
  const logs = await HabitLog.find({
    habit_id: { $in: habitIds },
    date: date,
  });
  
  const logMap = logs.reduce((acc, log) => {
    acc[log.habit_id.toString()] = log;
    return acc;
  }, {});
  
  const today = startOfDay(new Date());
  const reqDateStart = startOfDay(reqDateObj);
  const isPast = isBefore(reqDateStart, today);
  
  const mappedHabits = habits.map(habit => {
    const log = logMap[habit._id.toString()];
    let status = 'pending';
    
    if (log && log.status === 'done') {
      status = 'done';
    } else if (log && log.status === 'missed') {
      status = 'missed';
    } else if (!log && isPast) {
      status = 'missed';
    }
    
    return {
      ...habit.toObject(),
      status,
      progress_value: log ? log.progress_value : 0,
      log_id: log ? log._id : null
    };
  });
  
  res.status(200).json({ success: true, count: mappedHabits.length, data: mappedHabits });
});
