# Habit Tracker - Architecture & Logic Context

## 1. Overview
This document outlines the architecture, database schema, and core logic for a Habit Tracker built on the MEAN stack (MongoDB, Express, Node.js). The application supports flexible habit scheduling, daily tracking, cached statistics, and **retroactive logging** (allowing users to log or edit habits from past days without breaking the calculation flow).

## 2. Database Schema Strategy (MongoDB/Mongoose)
We use two primary collections to handle habits efficiently:
* **Habit Collection:** Stores the habit definition (name, icon, color), its repeat schedule (e.g., specific days), the goal (duration, count), and an embedded `stats` object. The `stats` object acts as a **cache** (current streak, best streak, total completions) to avoid recalculating on every app load.
* **HabitLog Collection:** Stores daily logs. Each document represents a single habit on a specific date for a specific user. It uses a compound unique index on `{ habitId, logDate }` to prevent duplicates.

## 3. The Habit Lifecycle & Core Flows

### A. Fetching Habits for a Specific Date (Calendar Strip Flow)
When the user selects a date (e.g., "Today" or "Last Friday"):
1. The backend queries the `Habit` collection for all active habits scheduled for that day of the week (using the `repeat.days` array).
2. The backend queries the `HabitLog` collection for logs matching the `userId` and `logDate`.
3. **The Merge:** The backend merges the arrays. 
   - If a log exists, its status (`done`, `skipped`, `missed`) is returned.
   - If no log exists and the date is in the past, it defaults to `missed`.
   - If no log exists and the date is today, it defaults to `pending`.

### B. Logging a Habit (Including Retroactive Updates)
When a user marks a habit as `done`, `skipped`, or `missed` for a specific date:
1. **Upsert Log:** The backend performs an `findOneAndUpdate` with `upsert: true` on the `HabitLog` collection for the given `habitId` and `logDate`.
2. **The Butterfly Effect (Recalculation):** Because the user might edit a past date, simply incrementing the streak is unsafe. The backend triggers an asynchronous `recalculateStreaks(habitId)` function.
3. **Recalculation Logic:** - Fetches all `HabitLogs` for the specific habit sorted by `logDate`.
   - Iterates through the dates, factoring in the habit's allowed repeat days.
   - Calculates the exact `currentStreak`, `bestStreak`, and `totalCompletions`.
   - Updates the cached `stats` in the `Habit` document.

## 4. API Endpoints
* `POST /api/habits` - Create a new habit.
* `GET /api/habits/date/:date` - Get all user habits merged with their statuses for a specific date.
* `POST /api/habits/log` - Upsert a daily log for a habit and trigger streak recalculation.