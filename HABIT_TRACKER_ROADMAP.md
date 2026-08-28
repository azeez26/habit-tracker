# 🎯 Habit Tracker - Backend Development Roadmap

## 📋 Overview
- **Project Type:** Free, Timezone-aware Habit Tracker
- **Backend:** Node.js + Express + MongoDB
- **Database:** Mongoose
- **Frontend:** React/Angular (flexible for mobile conversion)
- **Timeline:** 3-4 weeks (MVP)
- **Focus:** Backend only (frontend separate)

---

# 📅 Development Sprints

## 🔴 SPRINT 1: Foundation & Timezone Setup (Week 1)
**Goal:** Fix critical timezone handling and prepare data models

### Task 1.1: Add Timezone & Localization to User Model
**Priority:** CRITICAL  
**Est. Time:** 30 min

**What to do:**
Add timezone and language fields to User schema to track user's location for accurate date calculations.

**Code Example:**
```javascript
// backend/src/models/User.model.js - Add to userSchema:

timezone: {
  type: String,
  default: 'Africa/Cairo',
  enum: ['Africa/Cairo', 'Africa/Casablanca', 'Africa/Johannesburg', 
         'Asia/Dubai', 'Asia/Riyadh', 'Europe/London', 'America/New_York'],
  // Add all timezones or use IANA timezone database
},
language: {
  type: String,
  enum: ['ar', 'en'],
  default: 'ar'
},
country: {
  type: String,
  default: 'Egypt'
}
```

**Checklist:**
- [ ] Add 3 new fields to User schema
- [ ] Add default values
- [ ] Update validation schema for register/update

---

### Task 1.2: Create Timezone Utility Functions
**Priority:** CRITICAL  
**Est. Time:** 1 hour

**What to do:**
Build robust date utilities that handle timezone conversions properly for the app.

**Code Example:**
```javascript
// backend/src/utils/timezoneUtils.js

import { utcToZonedTime, zonedTimeToUtc, format } from 'date-fns-tz';
import { parseISO, startOfDay, endOfDay } from 'date-fns';

/**
 * Get day of week (0=Saturday, 6=Friday) for user's timezone
 * @param {string} dateString - ISO date "YYYY-MM-DD"
 * @param {string} timezone - User's timezone "Africa/Cairo"
 * @returns {number} 0-6
 */
export const getLocalDayOfWeek = (dateString, timezone) => {
  const date = parseISO(dateString);
  const zonedDate = utcToZonedTime(date, timezone);
  const jsDay = zonedDate.getDay();
  return (jsDay + 1) % 7; // Saturday = 0
};

/**
 * Convert user's local date to UTC for storage
 * @param {string} localDateString - "YYYY-MM-DD" in user's timezone
 * @param {string} timezone - User's timezone
 * @returns {Date} UTC date
 */
export const localDateToUTC = (localDateString, timezone) => {
  const date = parseISO(localDateString);
  return zonedTimeToUtc(date, timezone);
};

/**
 * Get today's date in user's timezone
 * @param {string} timezone - User's timezone
 * @returns {string} "YYYY-MM-DD"
 */
export const getTodayInTimezone = (timezone) => {
  const now = new Date();
  const zonedDate = utcToZonedTime(now, timezone);
  return format(zonedDate, 'yyyy-MM-dd');
};

/**
 * Check if date is in the past for user's timezone
 * @param {string} dateString - "YYYY-MM-DD"
 * @param {string} timezone - User's timezone
 * @returns {boolean}
 */
export const isDateInPast = (dateString, timezone) => {
  const date = parseISO(dateString);
  const zonedDate = utcToZonedTime(date, timezone);
  const today = utcToZonedTime(new Date(), timezone);
  return startOfDay(zonedDate) < startOfDay(today);
};
```

**Checklist:**
- [ ] Install `date-fns-tz` package
- [ ] Create timezoneUtils.js
- [ ] Write 4 main functions
- [ ] Write unit tests for each function
- [ ] Update package.json

---

### Task 1.3: Update HabitLog Model with Timezone
**Priority:** CRITICAL  
**Est. Time:** 20 min

**What to do:**
Modify HabitLog to track both the date and timezone when habit is logged.

**Code Example:**
```javascript
// backend/src/models/HabitLog.model.js

const habitLogSchema = new mongoose.Schema(
  {
    habit_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // "YYYY-MM-DD" in user's timezone
      required: true,
    },
    timezone: {
      type: String, // "Africa/Cairo" - timezone when logged
      required: true,
    },
    status: {
      type: String,
      enum: ['done', 'missed'],
      required: true,
    },
    progress_value: {
      type: Number,
      default: 0,
      min: 0,
    },
    logged_at: {
      type: Date,
      default: Date.now, // Actual UTC moment
    },
  },
  { timestamps: true }
);

// Unique index: one log per habit per date per timezone
habitLogSchema.index({ habit_id: 1, date: 1, timezone: 1 }, { unique: true });
```

**Checklist:**
- [ ] Add timezone field
- [ ] Add logged_at field
- [ ] Update unique index
- [ ] Test schema

---

### Task 1.4: Update dateUtils.js (Replace Old One)
**Priority:** CRITICAL  
**Est. Time:** 15 min

**What to do:**
Replace the old `dateUtils.js` with timezone-aware version.

**Code Example:**
```javascript
// backend/src/utils/dateUtils.js - REPLACE ENTIRE FILE

import { utcToZonedTime } from 'date-fns-tz';
import { parseISO } from 'date-fns';

/**
 * Get day of week (0=Saturday, 6=Friday) for given date in timezone
 * @param {string} dateString - ISO date "YYYY-MM-DD"
 * @param {string} timezone - User's timezone
 * @returns {number} 0-6
 */
export const getLocalDayOfWeek = (dateString, timezone) => {
  const date = parseISO(dateString);
  const zonedDate = utcToZonedTime(date, timezone);
  const jsDay = zonedDate.getDay();
  return (jsDay + 1) % 7; // Saturday = 0, Friday = 6
};
```

**Checklist:**
- [ ] Replace old getLocalDayOfWeek
- [ ] Remove old implementation
- [ ] Test with timezone parameter

---

### Task 1.5: Update Auth Controller - Return Timezone in Response
**Priority:** HIGH  
**Est. Time:** 20 min

**What to do:**
Ensure login/register returns timezone info so frontend knows user's timezone.

**Code Example:**
```javascript
// backend/src/controllers/authController.js

export const register = catchAsync(async (req, res, next) => {
    const { name, email, password, timezone, language } = req.body;
    
    // ... existing code ...
    
    const user = await User.create({ 
      name, 
      email, 
      password, 
      avatar: name[0].toUpperCase(),
      timezone: timezone || 'Africa/Cairo', // Default
      language: language || 'ar',
    });
    
    const token = signToken(user._id);
    
    res.status(201).json({ 
      success: true,
      user: user.toJSON(), 
      token,
      timezone: user.timezone // Send timezone to frontend
    });
});

export const login = catchAsync(async (req, res, next) => {
    // ... existing code ...
    
    if (user && (await user.matchPassword(password))) {
        const token = signToken(user._id);
        res.json({ 
          success: true,
          user: user.toJSON(), 
          token,
          timezone: user.timezone // Send timezone to frontend
        });
    }
});
```

**Checklist:**
- [ ] Add timezone to register validation
- [ ] Add timezone to login response
- [ ] Add timezone to /me endpoint
- [ ] Test API responses

---

## 🟠 SPRINT 2: Habit Logging & Streaks (Week 1-2)
**Goal:** Implement core logging feature and streak calculation

### Task 2.1: Create HabitLog Endpoint
**Priority:** CRITICAL  
**Est. Time:** 1.5 hours

**What to do:**
Build endpoint to log/update a habit for a specific date. This is the main feature!

**Code Example:**
```javascript
// backend/src/controllers/habitLogController.js - NEW FILE

import HabitLog from '../models/HabitLog.model.js';
import Habit from '../models/Habit.model.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { getTodayInTimezone } from '../utils/timezoneUtils.js';

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
  
  // Validate
  if (!habitId) {
    return next(new AppError('Habit ID required', 400));
  }
  if (!date || !status) {
    return next(new AppError('Date and status required', 400));
  }
  
  // Check habit exists and belongs to user
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
```

**Routes Addition:**
```javascript
// backend/src/routes/habit.routes.js - ADD THESE:

import { logHabit, getHabitLogs } from '../controllers/habitLogController.js';
import { logHabitSchema } from '../validations/habit.schema.js';

router.post('/:habitId/log', validateRequest(logHabitSchema), logHabit);
router.get('/:habitId/logs', getHabitLogs);
```

**Validation Schema:**
```javascript
// backend/src/validations/habit.schema.js - ADD:

export const logHabitSchema = Joi.object({
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'Date must be YYYY-MM-DD format' }),
  status: Joi.string()
    .valid('done', 'missed')
    .required(),
  progress_value: Joi.number()
    .min(0)
    .optional()
    .messages({ 'number.min': 'Progress cannot be negative' })
});
```

**Checklist:**
- [ ] Create habitLogController.js
- [ ] Add logHabit endpoint
- [ ] Add getHabitLogs endpoint
- [ ] Add validation schema
- [ ] Add routes
- [ ] Test with Postman/Insomnia

---

### Task 2.2: Implement Streak Calculation Function
**Priority:** CRITICAL  
**Est. Time:** 1.5 hours

**What to do:**
Build the core algorithm that calculates current streak, best streak, and total completions.

**Code Example:**
```javascript
// backend/src/Services/habit.service.js - ADD THIS FUNCTION:

import HabitLog from '../models/HabitLog.model.js';
import Habit from '../models/Habit.model.js';
import { parseISO, addDays, isBefore } from 'date-fns';

/**
 * Recalculate streaks and stats for a habit
 * Called after logging to update cached stats
 * 
 * Algorithm:
 * 1. Get all logs for this habit sorted by date
 * 2. Iterate backwards from today to find current streak
 * 3. Track best streak encountered
 * 4. Count total completions
 * 5. Update habit.stats
 */
export async function recalculateStreaks(habitId, userId) {
  try {
    const habit = await Habit.findOne({ 
      _id: habitId, 
      user_id: userId 
    });
    
    if (!habit) {
      console.error(`Habit ${habitId} not found`);
      return;
    }
    
    // Get all logs for this habit, sorted by date DESC
    const logs = await HabitLog.find({
      habit_id: habitId,
      user_id: userId
    }).sort({ date: -1 }).lean();
    
    if (logs.length === 0) {
      // No logs yet - reset stats
      habit.stats = {
        current_streak: 0,
        best_streak: 0,
        total_completions: 0,
        last_completed: null
      };
      await habit.save();
      return;
    }
    
    // Get unique dates from logs (deduplicate if multiple timezones)
    const dateLogsMap = {};
    logs.forEach(log => {
      if (!dateLogsMap[log.date]) {
        dateLogsMap[log.date] = log;
      }
    });
    
    const sortedDates = Object.keys(dateLogsMap).sort().reverse();
    const sortedLogs = sortedDates.map(d => dateLogsMap[d]);
    
    // Calculate streaks
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let totalCompletions = 0;
    let lastCompletedDate = null;
    
    for (let i = 0; i < sortedLogs.length; i++) {
      const log = sortedLogs[i];
      
      if (log.status === 'done') {
        tempStreak++;
        totalCompletions++;
        if (!lastCompletedDate) {
          lastCompletedDate = log.date;
        }
      } else if (log.status === 'missed') {
        if (i === 0) {
          // Current day is missed, streak is 0
          currentStreak = 0;
        } else if (i > 0 && sortedLogs[i - 1].status === 'done') {
          // Streak ended
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 0;
        }
      }
    }
    
    // Last streak
    currentStreak = sortedLogs[0].status === 'done' ? tempStreak : 0;
    bestStreak = Math.max(bestStreak, tempStreak);
    
    // Update habit with new stats
    habit.stats = {
      current_streak: currentStreak,
      best_streak: bestStreak,
      total_completions: totalCompletions,
      last_completed: lastCompletedDate
    };
    
    await habit.save();
    console.log(`Streaks updated for habit ${habitId}:`, habit.stats);
    
  } catch (error) {
    console.error(`Error calculating streaks for habit ${habitId}:`, error);
  }
}
```

**Checklist:**
- [ ] Add recalculateStreaks function to habit.service.js
- [ ] Call it from logHabit endpoint
- [ ] Write unit tests for streak calculation
- [ ] Test with various scenarios:
  - [ ] New habit (no logs)
  - [ ] Missed day breaks streak
  - [ ] Multiple completions
  - [ ] Retroactive logging

---

### Task 2.3: Add Stats Field to Habit Model
**Priority:** CRITICAL  
**Est. Time:** 15 min

**What to do:**
Add embedded stats object to Habit schema to cache streak calculations.

**Code Example:**
```javascript
// backend/src/models/Habit.model.js - ADD IN SCHEMA:

const habitSchema = new mongoose.Schema(
  {
    // ... existing fields ...
    
    stats: {
      type: {
        current_streak: {
          type: Number,
          default: 0
        },
        best_streak: {
          type: Number,
          default: 0
        },
        total_completions: {
          type: Number,
          default: 0
        },
        last_completed: {
          type: String, // "YYYY-MM-DD"
          default: null
        }
      },
      default: {
        current_streak: 0,
        best_streak: 0,
        total_completions: 0,
        last_completed: null
      }
    }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);
```

**Checklist:**
- [ ] Add stats object to Habit schema
- [ ] Set default values
- [ ] Test schema creation

---

### Task 2.4: Update getHabitsByDay Controller
**Priority:** HIGH  
**Est. Time:** 1 hour

**What to do:**
Update existing controller to use timezone and return stats.

**Code Example:**
```javascript
// backend/src/controllers/habit.controller.js - REPLACE getHabitsByDay:

import { getLocalDayOfWeek, isDateInPast } from '../utils/timezoneUtils.js';

export const getHabitsByDay = catchAsync(async (req, res, next) => {
  const { date } = req.params; // 'YYYY-MM-DD'
  const userId = req.user._id;
  const timezone = req.user.timezone;
  
  if (!date) {
    return next(new AppError('Please provide a date', 400));
  }

  // Get day of week for user's timezone
  const dayOfWeek = getLocalDayOfWeek(date, timezone);
  
  // Calculate next day boundary
  const reqDateObj = new Date(date + 'T00:00:00Z');
  const nextDayObj = new Date(reqDateObj.getTime() + 24 * 60 * 60 * 1000);

  // Get all habits scheduled for this day
  const habits = await Habit.find({
    user_id: userId,
    days: { $in: [dayOfWeek] },
    created_at: { $lt: nextDayObj },
    $or: [
      { ended_at: null },
      { ended_at: { $gt: reqDateObj } }
    ]
  });
  
  // Get logs for this date
  const habitIds = habits.map(h => h._id);
  const logs = await HabitLog.find({
    habit_id: { $in: habitIds },
    date: date,
    user_id: userId
  });
  
  const logMap = logs.reduce((acc, log) => {
    acc[log.habit_id.toString()] = log;
    return acc;
  }, {});
  
  // Determine status
  const isPast = isDateInPast(date, timezone);
  
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
      log_id: log ? log._id : null,
      stats: habit.stats // Include cached stats
    };
  });
  
  res.status(200).json({ 
    success: true, 
    count: mappedHabits.length, 
    data: mappedHabits 
  });
});
```

**Checklist:**
- [ ] Update to use timezone parameter
- [ ] Use timezone utilities
- [ ] Return stats in response
- [ ] Test with different timezones

---

## 🟡 SPRINT 3: Bug Fixes & Validation (Week 2)
**Goal:** Fix security issues and improve data validation

### Task 3.1: Fix Avatar Generation Bug
**Priority:** HIGH  
**Est. Time:** 15 min

**What to do:**
Add safety check for avatar generation to prevent crash on empty name.

**Code Example:**
```javascript
// backend/src/controllers/authController.js - FIX register:

const avatar = name && name.length > 0 
  ? name[0].toUpperCase() 
  : '👤'; // Default fallback

const user = await User.create({ 
  name, 
  email, 
  password, 
  avatar,
  timezone: timezone || 'Africa/Cairo',
  language: language || 'ar'
});
```

**Checklist:**
- [ ] Add null/empty check
- [ ] Add fallback avatar
- [ ] Test with empty name

---

### Task 3.2: Add User Authorization Check in editHabit
**Priority:** CRITICAL (Security)  
**Est. Time:** 20 min

**What to do:**
Fix IDOR vulnerability - ensure user can only edit their own habits.

**Code Example:**
```javascript
// backend/src/controllers/habit.controller.js - FIX editHabit:

export const editHabit = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  if (!id) {
    return next(new AppError('Please provide habit id', 400));
  }

  // ✅ FIX: Add user_id check
  const habit = await Habit.findOne({ 
    _id: id, 
    user_id: req.user._id  // CRITICAL: Check ownership
  });
  
  if (!habit) {
    return next(new AppError('Habit not found or unauthorized', 404));
  }

  const clonedHabit = await updateHabit(id, req.user._id, req.body);
  if (!clonedHabit) {
    return next(new AppError('Failed to update habit', 500));
  }

  res.status(200).json({ success: true, data: clonedHabit });
});
```

**Checklist:**
- [ ] Add user_id check in findOne
- [ ] Test unauthorized access
- [ ] Test authorized access

---

### Task 3.3: Fix Password Not Removed in Auth Responses
**Priority:** HIGH (Security)  
**Est. Time:** 15 min

**What to do:**
Ensure password is never sent to frontend, even in register response.

**Code Example:**
```javascript
// backend/src/controllers/authController.js - FIX ALL endpoints:

export const register = catchAsync(async (req, res, next) => {
    // ... create user ...
    
    const token = signToken(user._id);
    
    res.status(201).json({ 
      success: true,
      user: user.toJSON(), // ✅ This removes password automatically
      token,
      timezone: user.timezone
    });
});

export const me = catchAsync(async (req, res, next) => {
    // req.user already has password excluded by auth middleware
    res.json({ 
      success: true,
      data: req.user.toJSON() 
    });
});
```

**Checklist:**
- [ ] Update all auth responses to use .toJSON()
- [ ] Test password is not in response
- [ ] Verify User model has toJSON method (it does)

---

### Task 3.4: Add Input Validation for Registration
**Priority:** HIGH  
**Est. Time:** 20 min

**What to do:**
Add proper Joi validation schema for register/update endpoints.

**Code Example:**
```javascript
// backend/src/validations/auth.schema.js - ADD:

export const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({ 'string.min': 'Name must be at least 2 characters' }),
  
  email: Joi.string()
    .email()
    .lowercase()
    .required(),
  
  password: Joi.string()
    .min(6)
    .max(50)
    .required()
    .messages({ 'string.min': 'Password must be at least 6 characters' }),
  
  timezone: Joi.string()
    .valid('Africa/Cairo', 'Africa/Casablanca', 'Asia/Dubai', '...')
    .optional(),
  
  language: Joi.string()
    .valid('ar', 'en')
    .optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).optional(),
  timezone: Joi.string().optional(),
  language: Joi.string().valid('ar', 'en').optional(),
  morningMotivation: Joi.boolean().optional()
});
```

**Checklist:**
- [ ] Add register schema with validations
- [ ] Add update profile schema
- [ ] Apply to routes
- [ ] Test validation errors

---

## 🟢 SPRINT 4: Dashboard & Advanced Features (Week 3)
**Goal:** Add endpoints for analytics and dashboard display

### Task 4.1: Create Dashboard Stats Endpoint
**Priority:** HIGH  
**Est. Time:** 1.5 hours

**What to do:**
Build endpoint that returns all stats user needs for dashboard.

**Code Example:**
```javascript
// backend/src/controllers/dashboardController.js - NEW FILE:

import Habit from '../models/Habit.model.js';
import HabitLog from '../models/HabitLog.model.js';
import catchAsync from '../utils/catchAsync.js';
import { getTodayInTimezone, getLocalDayOfWeek } from '../utils/timezoneUtils.js';

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
    $or: [{ ended_at: null }, { ended_at: { $gt: new Date() } }]
  });
  
  // Get today's habits scheduled for this day
  const todayHabits = allHabits.filter(h => h.days.includes(dayOfWeek));
  
  // Get today's logs
  const todayLogs = await HabitLog.find({
    user_id: userId,
    date: today
  });
  
  const logMap = todayLogs.reduce((acc, log) => {
    acc[log.habit_id.toString()] = log;
    return acc;
  }, {});
  
  // Calculate summary
  const completedCount = todayLogs.filter(l => l.status === 'done').length;
  const missedCount = todayLogs.filter(l => l.status === 'missed').length;
  const pendingCount = todayHabits.length - todayLogs.length;
  
  // Calculate total best streak
  const totalBestStreak = allHabits.reduce((sum, h) => sum + (h.stats?.best_streak || 0), 0);
  const totalCompletions = allHabits.reduce((sum, h) => sum + (h.stats?.total_completions || 0), 0);
  
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
        completion_rate: todayHabits.length > 0 
          ? Math.round((completedCount / todayHabits.length) * 100) 
          : 0
      },
      overall: {
        total_habits: allHabits.length,
        total_best_streak: totalBestStreak,
        total_completions: totalCompletions
      },
      habits: todayHabits.map(habit => ({
        id: habit._id,
        name: habit.name,
        goal_type: habit.goal_type,
        goal_target: habit.goal_target,
        status: logMap[habit._id.toString()]?.status || 'pending',
        progress_value: logMap[habit._id.toString()]?.progress_value || 0,
        stats: habit.stats
      }))
    }
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
    return next(new AppError('Month format should be YYYY-MM', 400));
  }
  
  // Get all logs for the month
  const monthLogs = await HabitLog.find({
    user_id: userId,
    date: { $regex: `^${month}` }
  }).lean();
  
  // Group by habit
  const habitStats = {};
  
  monthLogs.forEach(log => {
    if (!habitStats[log.habit_id.toString()]) {
      habitStats[log.habit_id.toString()] = {
        completed: 0,
        missed: 0,
        total: 0
      };
    }
    
    habitStats[log.habit_id.toString()].total++;
    if (log.status === 'done') {
      habitStats[log.habit_id.toString()].completed++;
    } else {
      habitStats[log.habit_id.toString()].missed++;
    }
  });
  
  // Get habit details
  const habits = await Habit.find({
    user_id: userId,
    is_active: true
  });
  
  const result = habits.map(h => {
    const stats = habitStats[h._id.toString()] || { completed: 0, missed: 0, total: 0 };
    return {
      id: h._id,
      name: h.name,
      completed: stats.completed,
      missed: stats.missed,
      total: stats.total,
      completion_rate: stats.total > 0 
        ? Math.round((stats.completed / stats.total) * 100)
        : 0
    };
  });
  
  res.status(200).json({
    success: true,
    month,
    data: result
  });
});
```

**Routes:**
```javascript
// backend/src/routes/dashboard.routes.js - NEW FILE:

import express from 'express';
import { getDashboardStats, getMonthStats } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getDashboardStats);
router.get('/month', getMonthStats);

export default router;

// Add to server.js:
// app.use('/api/dashboard', dashboardRoutes);
```

**Checklist:**
- [ ] Create dashboardController.js
- [ ] Create dashboard.routes.js
- [ ] Add both endpoints
- [ ] Add route to server.js
- [ ] Test dashboard endpoint
- [ ] Test month stats endpoint

---

### Task 4.2: Create Habit History Endpoint (Parent Chain)
**Priority:** MEDIUM  
**Est. Time:** 45 min

**What to do:**
Build endpoint to trace full history of a habit through all its versions.

**Code Example:**
```javascript
// backend/src/controllers/habit.controller.js - ADD:

/**
 * GET /api/habits/:id/history
 * Get all versions of a habit (parent chain)
 */
export const getHabitHistory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;
  
  // Get root habit
  const rootHabit = await Habit.findOne({
    _id: id,
    user_id: userId
  });
  
  if (!rootHabit) {
    return next(new AppError('Habit not found', 404));
  }
  
  const rootId = rootHabit.root_habit_id || rootHabit._id;
  
  // Get all versions in the chain
  const history = await Habit.find({
    $or: [
      { root_habit_id: rootId },
      { _id: rootId }
    ],
    user_id: userId
  }).sort({ created_at: -1 });
  
  // Build chain structure
  const chain = history.map(h => ({
    id: h._id,
    name: h.name,
    goal_type: h.goal_type,
    goal_target: h.goal_target,
    days: h.days,
    is_active: h.is_active,
    created_at: h.created_at,
    ended_at: h.ended_at,
    stats: h.stats
  }));
  
  res.status(200).json({
    success: true,
    root_id: rootId,
    count: chain.length,
    data: chain
  });
});
```

**Routes Update:**
```javascript
router.get('/:id/history', getHabitHistory);
```

**Checklist:**
- [ ] Add getHabitHistory function
- [ ] Add route
- [ ] Test history retrieval
- [ ] Test parent chain tracing

---

## 🔵 SPRINT 5: Testing & Documentation (Week 3-4)
**Goal:** Ensure code quality and create documentation

### Task 5.1: Write Unit Tests for Core Functions
**Priority:** MEDIUM  
**Est. Time:** 2 hours

**What to do:**
Create test suite for critical functions (timezone, streak calculation, etc).

**Code Example:**
```javascript
// backend/tests/unit/timezoneUtils.test.js - NEW FILE:

import { describe, it, expect } from '@jest/globals';
import {
  getLocalDayOfWeek,
  getTodayInTimezone,
  isDateInPast
} from '../../src/utils/timezoneUtils.js';

describe('Timezone Utilities', () => {
  it('should get correct day of week for Saturday', () => {
    const day = getLocalDayOfWeek('2026-08-22', 'Africa/Cairo'); // Saturday
    expect(day).toBe(0);
  });
  
  it('should get correct day of week for Friday', () => {
    const day = getLocalDayOfWeek('2026-08-28', 'Africa/Cairo'); // Friday
    expect(day).toBe(6);
  });
  
  it('should handle different timezones correctly', () => {
    const cairoDay = getLocalDayOfWeek('2026-08-22', 'Africa/Cairo');
    const dubaiDay = getLocalDayOfWeek('2026-08-22', 'Asia/Dubai');
    expect(cairoDay).toBe(dubaiDay); // Same date = same day of week
  });
  
  it('should identify past dates correctly', () => {
    const isPast = isDateInPast('2020-01-01', 'Africa/Cairo');
    expect(isPast).toBe(true);
  });
});

// backend/tests/unit/habit.service.test.js:

describe('Streak Calculation', () => {
  it('should calculate 0 streak for new habit', () => {
    // Mock: no logs
    const streak = calculateCurrentStreak([]);
    expect(streak).toBe(0);
  });
  
  it('should calculate correct current streak', () => {
    // Mock: 3 consecutive done logs
    const logs = [
      { date: '2026-08-24', status: 'done' },
      { date: '2026-08-23', status: 'done' },
      { date: '2026-08-22', status: 'done' }
    ];
    const streak = calculateCurrentStreak(logs);
    expect(streak).toBe(3);
  });
  
  it('should break streak on missed day', () => {
    const logs = [
      { date: '2026-08-24', status: 'missed' }, // Breaks streak
      { date: '2026-08-23', status: 'done' }
    ];
    const streak = calculateCurrentStreak(logs);
    expect(streak).toBe(0);
  });
});
```

**Checklist:**
- [ ] Setup Jest
- [ ] Write timezone tests
- [ ] Write streak calculation tests
- [ ] Write auth tests
- [ ] Achieve 80%+ coverage

---

### Task 5.2: Create API Documentation
**Priority:** MEDIUM  
**Est. Time:** 1.5 hours

**What to do:**
Write comprehensive API documentation (in README or separate file).

**Code Example:**
```markdown
# Habit Tracker API Documentation

## Base URL
```
https://api.habittracker.com/api
```

## Authentication
All protected endpoints require JWT token in header:
```
Authorization: Bearer YOUR_TOKEN
```

### Auth Endpoints

#### Register
```
POST /v1/auth/register
Content-Type: application/json

{
  "name": "Ahmed",
  "email": "ahmed@example.com",
  "password": "secure123",
  "timezone": "Africa/Cairo",
  "language": "ar"
}

Response:
{
  "success": true,
  "user": { ... },
  "token": "eyJhbGc..."
}
```

#### Login
```
POST /v1/auth/login

{
  "email": "ahmed@example.com",
  "password": "secure123"
}
```

### Habit Endpoints

#### Create Habit
```
POST /habits (PROTECTED)

{
  "name": "Exercise",
  "goal_type": "duration", // or "count"
  "goal_target": 30, // minutes or count
  "days": [0, 1, 2, 3, 4], // Saturday to Wednesday
  "time": "07:00" // Optional
}
```

#### Log Habit
```
POST /habits/:habitId/log (PROTECTED)

{
  "date": "2026-08-26",
  "status": "done", // or "missed"
  "progress_value": 30 // Optional
}
```

#### Get Today's Habits
```
GET /habits/day/2026-08-26 (PROTECTED)
```

#### Get Dashboard
```
GET /dashboard (PROTECTED)
```

## Response Format
All responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Errors:
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```
```

**Checklist:**
- [ ] Document all endpoints
- [ ] Include request/response examples
- [ ] Document timezone options
- [ ] Document error codes
- [ ] Create swagger/openapi spec (optional)

---

## 📊 Summary Table

| Sprint | Week | Tasks | Priority |
|--------|------|-------|----------|
| **1** | Week 1 | Timezone setup, User model, utilities | CRITICAL |
| **2** | Week 1-2 | Logging endpoint, streak calculation, stats | CRITICAL |
| **3** | Week 2 | Bug fixes, validation, security | HIGH |
| **4** | Week 3 | Dashboard, history endpoints | MEDIUM |
| **5** | Week 3-4 | Tests, documentation | MEDIUM |

---

## 🚀 Getting Started

### Week 1 Action Items:
1. ✅ Start with Task 1.1 (User timezone field)
2. ✅ Then Task 1.2 (Timezone utilities)
3. ✅ Then Task 1.3 (HabitLog model)
4. ✅ Test everything before moving forward

### Installation:
```bash
# Install new dependency
npm install date-fns-tz

# Or if using yarn
yarn add date-fns-tz
```

---

## 📝 Notes

- Each task has a code example you can use as reference
- Checklist helps track progress
- Test after each task
- Commit to git after each sprint
- Ask for clarification on any task

**Ready to start? Begin with Sprint 1, Task 1.1! 🎯**
