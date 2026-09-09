# Habit Tracker

A RESTful Habit Tracker backend built with **Node.js, Express.js, MongoDB, and Mongoose**.

The backend provides authentication, habit scheduling, habit logs, streak calculation, automatic missed-occurrence handling, habit version/history, and dashboard/monthly statistics.

> **Backend status:** API is implemented and ready to be consumed by a frontend.  
> **Frontend note:** the backend is the source of truth for authentication, habits, logs, streaks, and dashboard data.

---

## 1. Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcryptjs
- Joi validation
- express-rate-limit
- date-fns
- date-fns-tz
- CORS
- Jest

---

## 2. Project Structure

```text
backend/
├── server.js
├── package.json
└── src/
    ├── config/
    │   └── db.js
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── dashboard.controller.js
    │   ├── habit.controller.js
    │   └── habitLog.controller.js
    ├── middleware/
    │   ├── auth.js
    │   ├── errorHandler.js
    │   ├── rateLimiter.js
    │   └── validate.js
    ├── models/
    │   ├── Habit.model.js
    │   ├── HabitLog.model.js
    │   └── User.model.js
    ├── routes/
    │   ├── auth.routes.js
    │   ├── dashboard.routes.js
    │   └── habit.routes.js
    ├── Services/
    │   └── habit.service.js
    ├── utils/
    │   ├── appError.js
    │   ├── catchAsync.js
    │   └── dateUtils.js
    └── validations/
        ├── auth.schema.js
        └── habit.schema.js
```

---

# 3. Setup

## Requirements

- Node.js
- MongoDB / MongoDB Atlas
- npm

## Install

```bash
cd backend
npm install
```

## Environment Variables

Create a `.env` file inside `backend/`:

```env
PORT=8000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d

GEMINI_API_KEY=
GEMINI_MODEL=

CLIENT_URL=http://localhost:3000
```

The server starts on:

```text
http://localhost:8000
```

Run development mode:

```bash
npm run dev
```

Run production/start mode:

```bash
npm start
```

Health check:

```http
GET /
```

Response:

```text
السيرفر شغال وربنا
```

---

# 4. API Base URLs

Authentication:

```text
/api/v1/auth
```

Habits:

```text
/api/habits
```

Dashboard:

```text
/api/dashboard
```

For local development:

```text
http://localhost:8000/api/v1/auth
http://localhost:8000/api/habits
http://localhost:8000/api/dashboard
```

---

# 5. Authentication Flow

The normal frontend flow is:

```text
Register
   ↓
Receive JWT
   ↓
Store token
   ↓
Send Authorization header
   ↓
Access protected APIs
```

Protected requests require:

```http
Authorization: Bearer YOUR_TOKEN
```

Example:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

The token is valid for **30 days** according to the current controller configuration.

---

# 6. Standard Error Response

Most application errors are returned in this format:

```json
{
  "success": false,
  "message": "Error message"
}
```

Common status codes:

| Status | Meaning |
|---|---|
| 200 | Successful request |
| 201 | Resource created |
| 400 | Invalid input / business rule violation |
| 401 | Authentication required / invalid token |
| 404 | Resource not found |
| 429 | Too many login attempts |
| 500 | Server error |

---

# 7. Authentication APIs

## 7.1 Register

```http
POST /api/v1/auth/register
```

### Body

```json
{
  "name": "Mostafa",
  "email": "mostafa@example.com",
  "password": "123456",
  "timezone": "Africa/Cairo",
  "language": "ar"
}
```

### Required

- `name`
- `email`
- `password`

### Optional

- `timezone`
- `language`

Default values:

```text
timezone = Africa/Cairo
language = ar
```

Valid languages:

```text
ar
en
```

Timezone must be a valid IANA timezone.

Examples:

```text
Africa/Cairo
Europe/London
America/New_York
Asia/Riyadh
```

### Success Response

Status:

```text
201 Created
```

```json
{
  "success": true,
  "user": {
    "_id": "66f...",
    "name": "Mostafa",
    "email": "mostafa@example.com",
    "avatar": "M",
    "morningMotivation": true,
    "timezone": "Africa/Cairo",
    "language": "ar",
    "country": "Egypt",
    "createdAt": "2026-09-09T10:00:00.000Z",
    "updatedAt": "2026-09-09T10:00:00.000Z"
  },
  "token": "JWT_TOKEN",
  "timezone": "Africa/Cairo"
}
```

`password` is intentionally removed from the user JSON response.

### Possible Errors

Duplicate email:

```json
{
  "success": false,
  "message": "Email already registered"
}
```

Invalid input:

```json
{
  "success": false,
  "message": "\"email\" must be a valid email"
}
```

---

# 8. Login

```http
POST /api/v1/auth/login
```

### Body

```json
{
  "email": "mostafa@example.com",
  "password": "123456"
}
```

### Success

Status:

```text
200 OK
```

```json
{
  "success": true,
  "user": {
    "_id": "66f...",
    "name": "Mostafa",
    "email": "mostafa@example.com",
    "avatar": "M",
    "morningMotivation": true,
    "timezone": "Africa/Cairo",
    "language": "ar",
    "country": "Egypt"
  },
  "token": "JWT_TOKEN",
  "timezone": "Africa/Cairo"
}
```

### Invalid credentials

Status:

```text
401 Unauthorized
```

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Rate limiting

Login is protected by a rate limiter:

```text
5 attempts / 15 minutes
```

After exceeding the limit:

```text
429 Too Many Requests
```

---

# 9. Get Current User

```http
GET /api/v1/auth/me
```

### Headers

```http
Authorization: Bearer YOUR_TOKEN
```

### Response

```json
{
  "success": true,
  "data": {
    "_id": "66f...",
    "name": "Mostafa",
    "email": "mostafa@example.com",
    "avatar": "M",
    "morningMotivation": true,
    "timezone": "Africa/Cairo",
    "language": "ar",
    "country": "Egypt"
  }
}
```

---

# 10. Update Profile

```http
PUT /api/v1/auth/update
```

### Headers

```http
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

### Body

All fields are optional:

```json
{
  "name": "Mostafa Abdelaziz",
  "timezone": "Africa/Cairo",
  "language": "en",
  "morningMotivation": false
}
```

### Response

The current controller returns the updated user document.

Example:

```json
{
  "_id": "66f...",
  "name": "Mostafa Abdelaziz",
  "email": "mostafa@example.com",
  "avatar": "M",
  "morningMotivation": false,
  "timezone": "Africa/Cairo",
  "language": "en",
  "country": "Egypt",
  "createdAt": "2026-09-09T10:00:00.000Z",
  "updatedAt": "2026-09-09T11:00:00.000Z"
}
```

---

# 11. Habit Scheduling

The habit uses this weekday mapping:

| Value | Day |
|---:|---|
| 0 | Saturday |
| 1 | Sunday |
| 2 | Monday |
| 3 | Tuesday |
| 4 | Wednesday |
| 5 | Thursday |
| 6 | Friday |

If `days` is omitted when creating a habit, the Mongoose model defaults it to:

```json
[0, 1, 2, 3, 4, 5, 6]
```

Meaning:

```text
Every day
```

Example:

```json
{
  "days": [0, 2, 4]
}
```

means:

```text
Saturday
Monday
Wednesday
```

Only scheduled occurrences participate in streak calculation.

---

# 12. Create Habit

```http
POST /api/habits
```

### Headers

```http
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

### Body

Duration habit:

```json
{
  "name": "Reading",
  "goal_type": "duration",
  "goal_target": 30,
  "days": [0, 1, 2, 3, 4, 5, 6],
  "time": "20:00"
}
```

Count habit:

```json
{
  "name": "Push Ups",
  "goal_type": "count",
  "goal_target": 50,
  "days": [0, 2, 4],
  "time": "18:00"
}
```

### Fields

| Field | Type | Required |
|---|---|---|
| name | string | Yes |
| goal_type | `duration` / `count` | Yes |
| goal_target | number >= 1 | Yes |
| days | array of numbers 0-6 | No |
| time | string / null | No |

### Response

Status:

```text
201 Created
```

```json
{
  "success": true,
  "data": {
    "_id": "66fa...",
    "user_id": "66f...",
    "name": "Reading",
    "goal_type": "duration",
    "goal_target": 30,
    "days": [0, 1, 2, 3, 4, 5, 6],
    "time": "20:00",
    "is_active": true,
    "ended_at": null,
    "parent_habit_id": null,
    "root_habit_id": null,
    "stats": {
      "current_streak": 0,
      "best_streak": 0,
      "total_completions": 0,
      "last_completed": null
    },
    "created_at": "2026-09-09T10:00:00.000Z",
    "updated_at": "2026-09-09T10:00:00.000Z"
  }
}
```

---

# 13. Edit Habit

```http
PUT /api/habits/:id
```

Example:

```http
PUT /api/habits/66fa...
```

### Headers

```http
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

### Body

```json
{
  "name": "Reading",
  "goal_target": 45,
  "days": [0, 2, 4],
  "time": "21:00"
}
```

All update fields are optional.

### Important behavior

Editing a habit does **not** directly modify the old document.

The current service:

1. Deactivates the old habit.
2. Sets `ended_at`.
3. Creates a new habit version.
4. Sets `parent_habit_id`.
5. Preserves `root_habit_id`.

This allows habit history/versioning.

---

# 14. Delete Habit

```http
DELETE /api/habits/:id
```

### Headers

```http
Authorization: Bearer YOUR_TOKEN
```

This is a soft delete.

The habit is changed to:

```json
{
  "is_active": false,
  "ended_at": "2026-09-09T12:00:00.000Z"
}
```

The document is not physically deleted from MongoDB.

---

# 15. Get Habits For a Specific Day

```http
GET /api/habits/day/:date
```

Example:

```http
GET /api/habits/day/2026-09-09
```

### Headers

```http
Authorization: Bearer YOUR_TOKEN
```

The date must be:

```text
YYYY-MM-DD
```

The server calculates the weekday using the user's timezone.

### Response

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "66fa...",
      "user_id": "66f...",
      "name": "Reading",
      "goal_type": "duration",
      "goal_target": 30,
      "days": [0, 1, 2, 3, 4, 5, 6],
      "time": "20:00",
      "is_active": true,
      "ended_at": null,
      "parent_habit_id": null,
      "root_habit_id": null,
      "stats": {
        "current_streak": 3,
        "best_streak": 7,
        "total_completions": 15,
        "last_completed": "2026-09-08"
      },
      "status": "pending",
      "progress_value": 0,
      "log_id": null
    }
  ]
}
```

Possible status values:

```text
pending
done
missed
```

For a past date with no log, the controller reports:

```text
missed
```

---

# 16. Log a Habit

```http
POST /api/habits/:habitId/log
```

Example:

```http
POST /api/habits/66fa.../log
```

### Headers

```http
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

### Body

```json
{
  "date": "2026-09-09",
  "status": "done",
  "progress_value": 30
}
```

For a missed occurrence:

```json
{
  "date": "2026-09-08",
  "status": "missed",
  "progress_value": 0
}
```

### Important behavior

The endpoint only allows logging a date that is scheduled for the habit.

If the habit is scheduled:

```text
Saturday / Monday / Wednesday
```

you cannot manually log:

```text
Tuesday
```

The API returns:

```json
{
  "success": false,
  "message": "This date is not scheduled for this habit"
}
```

### Success Response

```text
200 OK
```

```json
{
  "success": true,
  "data": {
    "_id": "670...",
    "habit_id": "66fa...",
    "user_id": "66f...",
    "date": "2026-09-09",
    "timezone": "Africa/Cairo",
    "status": "done",
    "progress_value": 30,
    "logged_at": "2026-09-09T18:30:00.000Z",
    "createdAt": "2026-09-09T18:30:00.000Z",
    "updatedAt": "2026-09-09T18:30:00.000Z"
  },
  "message": "Habit logged successfully"
}
```

The endpoint uses an upsert, so logging the same habit/date again updates the existing log.

---

# 17. Automatic Missed Occurrences

The backend automatically creates `missed` logs for past scheduled occurrences that do not already have a log.

Example:

Habit schedule:

```text
Saturday
Monday
Wednesday
```

User does:

```text
Saturday → done
Monday   → no log
Wednesday → done
```

When missed occurrences are processed, the database becomes effectively:

```text
Saturday  → done
Monday    → missed
Wednesday → done
```

Therefore the streak becomes:

```text
current_streak = 1
```

The missed occurrence does not need to be manually created by the frontend.

The service is called when dashboard/streak calculations are performed.

---

# 18. Streak Logic

The streak is based on **scheduled occurrences**, not calendar days.

Example:

```text
Schedule:
Saturday / Monday / Wednesday

Saturday  → done
Monday    → done
Wednesday → done
```

Result:

```text
current_streak = 3
best_streak = 3
```

If Monday is missed:

```text
Saturday  → done
Monday    → missed
Wednesday → done
```

Result:

```text
current_streak = 1
```

because the Monday missed occurrence breaks the previous streak.

Non-scheduled days do not break a streak.

Example:

```text
Saturday  → done
Sunday    → not scheduled
Monday    → done
```

Result:

```text
current_streak = 2
```

---

# 19. Streak Stats

Each habit stores cached statistics:

```json
{
  "current_streak": 0,
  "best_streak": 0,
  "total_completions": 0,
  "last_completed": null
}
```

### `current_streak`

The latest consecutive run of completed scheduled occurrences.

### `best_streak`

The longest completed scheduled-occurrence streak ever calculated for that habit.

### `total_completions`

Number of `done` logs.

### `last_completed`

Date of the latest `done` log in:

```text
YYYY-MM-DD
```

---

# 20. Get Habit Logs

```http
GET /api/habits/:habitId/logs
```

Optional filters:

```http
GET /api/habits/:habitId/logs?fromDate=2026-09-01&toDate=2026-09-30
```

### Headers

```http
Authorization: Bearer YOUR_TOKEN
```

### Response

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "670...",
      "habit_id": "66fa...",
      "user_id": "66f...",
      "date": "2026-09-09",
      "timezone": "Africa/Cairo",
      "status": "done",
      "progress_value": 30,
      "logged_at": "2026-09-09T18:30:00.000Z",
      "createdAt": "2026-09-09T18:30:00.000Z",
      "updatedAt": "2026-09-09T18:30:00.000Z"
    }
  ]
}
```

Results are sorted by date descending.

---

# 21. Habit History

```http
GET /api/habits/:id/history
```

### Headers

```http
Authorization: Bearer YOUR_TOKEN
```

This returns all versions of a habit.

### Response

```json
{
  "success": true,
  "root_id": "66fa...",
  "count": 2,
  "data": [
    {
      "id": "670...",
      "name": "Reading",
      "goal_type": "duration",
      "goal_target": 45,
      "days": [0, 2, 4],
      "is_active": true,
      "created_at": "2026-09-09T12:00:00.000Z",
      "ended_at": null,
      "stats": {
        "current_streak": 0,
        "best_streak": 0,
        "total_completions": 0,
        "last_completed": null
      }
    },
    {
      "id": "66fa...",
      "name": "Reading",
      "goal_type": "duration",
      "goal_target": 30,
      "days": [0, 1, 2, 3, 4, 5, 6],
      "is_active": false,
      "created_at": "2026-09-01T12:00:00.000Z",
      "ended_at": "2026-09-09T12:00:00.000Z",
      "stats": {
        "current_streak": 5,
        "best_streak": 5,
        "total_completions": 8,
        "last_completed": "2026-09-08"
      }
    }
  ]
}
```

---

# 22. Dashboard

All dashboard endpoints are protected.

## 22.1 Today's Dashboard

```http
GET /api/dashboard
```

### Headers

```http
Authorization: Bearer YOUR_TOKEN
```

The endpoint:

1. Gets today's date in the user's timezone.
2. Finds active habits.
3. Processes past missed occurrences.
4. Recalculates habit streaks.
5. Returns today's scheduled habits.
6. Returns today's summary.
7. Returns overall statistics.

### Response

```json
{
  "success": true,
  "data": {
    "today": "2026-09-09",
    "timezone": "Africa/Cairo",
    "summary": {
      "total_habits": 3,
      "completed": 2,
      "missed": 0,
      "pending": 1,
      "completion_rate": 67
    },
    "overall": {
      "total_habits": 4,
      "max_best_streak": 12,
      "total_completions": 83
    },
    "habits": [
      {
        "id": "66fa...",
        "name": "Reading",
        "goal_type": "duration",
        "goal_target": 30,
        "status": "done",
        "progress_value": 30,
        "stats": {
          "current_streak": 4,
          "best_streak": 12,
          "total_completions": 20,
          "last_completed": "2026-09-09"
        }
      }
    ]
  }
}
```

---

# 23. Monthly Dashboard

```http
GET /api/dashboard/month?month=2026-09
```

The `month` query parameter must use:

```text
YYYY-MM
```

Example:

```http
GET /api/dashboard/month?month=2026-09
```

### Response

```json
{
  "success": true,
  "month": "2026-09",
  "data": [
    {
      "id": "66fa...",
      "name": "Reading",
      "completed": 15,
      "missed": 3,
      "total": 18,
      "completion_rate": 83
    }
  ]
}
```

Invalid month:

```json
{
  "success": false,
  "message": "Month format should be YYYY-MM"
}
```

---

# 24. Monthly Daily Statistics

This endpoint is intended for calendar/heatmap interfaces.

```http
GET /api/dashboard/month/daily?month=2026-09
```

### Response

```json
{
  "success": true,
  "month": "2026-09",
  "data": [
    {
      "date": "2026-09-01",
      "total_habits_scheduled": 0,
      "completed": 3,
      "missed": 1,
      "pending": 0,
      "completion_rate": 75,
      "total_habits_logged": 4
    },
    {
      "date": "2026-09-02",
      "total_habits_scheduled": 0,
      "completed": 4,
      "missed": 0,
      "pending": 0,
      "completion_rate": 100,
      "total_habits_logged": 4
    }
  ]
}
```

> **Frontend note:** `total_habits_scheduled` and `pending` are currently initialized by the controller but are not populated from the habit schedule in this endpoint. `completion_rate` is calculated from logged `done` + `missed` records. The frontend should therefore use the fields that are actually populated by the current implementation.

---

# 25. Postman Testing Guide

The easiest way to test the complete backend is to follow this order.

## Step 1 — Health Check

```http
GET http://localhost:8000/
```

Expected:

```text
السيرفر شغال وربنا
```

---

## Step 2 — Register

```http
POST http://localhost:8000/api/v1/auth/register
```

Body:

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "123456",
  "timezone": "Africa/Cairo",
  "language": "en"
}
```

Copy the returned:

```text
token
```

---

## Step 3 — Set Postman Authorization

For protected endpoints use:

```text
Authorization
Bearer Token
YOUR_TOKEN
```

Or manually:

```http
Authorization: Bearer YOUR_TOKEN
```

---

## Step 4 — Verify User

```http
GET http://localhost:8000/api/v1/auth/me
```

Expected:

```json
{
  "success": true,
  "data": {}
}
```

---

## Step 5 — Create Daily Habit

```http
POST http://localhost:8000/api/habits
```

Body:

```json
{
  "name": "Reading",
  "goal_type": "duration",
  "goal_target": 30,
  "time": "20:00"
}
```

Do not send `days` to test the default.

Expected:

```text
days = [0,1,2,3,4,5,6]
```

Save the returned habit `_id`.

---

## Step 6 — Get Today's Habits

```http
GET http://localhost:8000/api/habits/day/2026-09-09
```

Replace the date with the date you want to test.

---

## Step 7 — Log Habit as Done

```http
POST http://localhost:8000/api/habits/HABIT_ID/log
```

Body:

```json
{
  "date": "2026-09-09",
  "status": "done",
  "progress_value": 30
}
```

---

## Step 8 — Get Habit Logs

```http
GET http://localhost:8000/api/habits/HABIT_ID/logs
```

---

## Step 9 — Check Dashboard

```http
GET http://localhost:8000/api/dashboard
```

Check:

```text
summary
overall
habits
stats
```

---

## Step 10 — Test Habit Update

```http
PUT http://localhost:8000/api/habits/HABIT_ID
```

Body:

```json
{
  "goal_target": 45,
  "days": [0, 2, 4]
}
```

A new habit version should be created.

---

## Step 11 — Test History

```http
GET http://localhost:8000/api/habits/HABIT_ID/history
```

You should see the old and new versions.

---

## Step 12 — Test Monthly Stats

```http
GET http://localhost:8000/api/dashboard/month?month=2026-09
```

---

## Step 13 — Test Daily Monthly Stats

```http
GET http://localhost:8000/api/dashboard/month/daily?month=2026-09
```

---

# 26. Streak Test Scenario

To manually test the streak behavior, create a habit with:

```json
{
  "name": "Streak Test",
  "goal_type": "count",
  "goal_target": 1,
  "days": [0, 2, 4]
}
```

Meaning:

```text
Saturday
Monday
Wednesday
```

Then create completed logs for two scheduled occurrences.

Example:

```text
Saturday → done
Monday   → done
Wednesday → done
```

Expected:

```json
{
  "current_streak": 3,
  "best_streak": 3
}
```

To test a broken streak:

```text
Saturday → done
Monday   → missed
Wednesday → done
```

Expected:

```json
{
  "current_streak": 1
}
```

The Sunday and Tuesday dates do not matter because they are not scheduled.

---

# 27. Frontend Integration Flow

The frontend should generally follow this architecture:

```text
                    ┌─────────────┐
                    │   Register  │
                    └──────┬──────┘
                           ↓
                    Receive JWT
                           ↓
                  Store authentication
                           ↓
              ┌────────────┴────────────┐
              ↓                         ↓
       GET /auth/me              GET /dashboard
              ↓                         ↓
        User profile             Today's habits
                                        ↓
                              User completes habit
                                        ↓
                              POST /habits/:id/log
                                        ↓
                                Streak recalculation
                                        ↓
                              Refresh dashboard
```

For a habit details page:

```text
GET /api/habits/:id/history
              ↓
GET /api/habits/:habitId/logs
              ↓
Display history + completion records
```

For a monthly calendar:

```text
GET /api/dashboard/month/daily?month=YYYY-MM
              ↓
Build heatmap/calendar
```

For monthly habit statistics:

```text
GET /api/dashboard/month?month=YYYY-MM
              ↓
Build habit statistics
```

---

# 28. Recommended Frontend API Layer

The frontend should centralize API calls rather than writing `fetch()` calls throughout components.

Example structure:

```text
frontend/
└── services/
    ├── authApi.js
    ├── habitApi.js
    └── dashboardApi.js
```

Example request:

```js
const response = await fetch(
  `${API_URL}/api/habits/${habitId}/log`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      date,
      status: "done",
      progress_value,
    }),
  }
);

const data = await response.json();
```

---

# 29. Data Models

## User

```text
_id
name
email
password
avatar
morningMotivation
timezone
language
country
createdAt
updatedAt
```

The password is hashed with bcrypt and removed from JSON responses.

---

## Habit

```text
_id
user_id
name
goal_type
goal_target
days
time
is_active
ended_at
parent_habit_id
root_habit_id
stats
created_at
updated_at
```

---

## HabitLog

```text
_id
habit_id
user_id
date
timezone
status
progress_value
logged_at
createdAt
updatedAt
```

Unique index:

```text
habit_id + date + timezone
```

This prevents duplicate logs for the same habit/date/timezone combination.

---

# 30. Security

## Password hashing

Passwords are hashed using:

```text
bcryptjs
```

They are never returned in user JSON responses.

## JWT

Protected routes require:

```text
Bearer JWT
```

## Rate limiting

Login attempts are limited to:

```text
5 attempts per 15 minutes
```

## Input validation

Joi validates:

- Authentication input
- Habit input
- Habit log input

Validation runs before controllers.

---

# 31. CORS

The server allows:

- localhost
- 127.0.0.1
- configured origins from `CLIENT_URL`

Example:

```env
CLIENT_URL=http://localhost:3000
```

Multiple origins can be supplied separated by commas.

```env
CLIENT_URL=http://localhost:3000,http://localhost:5173
```

---

# 32. API Quick Reference

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/` | No | Health check |
| POST | `/api/v1/auth/register` | No | Register |
| POST | `/api/v1/auth/login` | No | Login |
| GET | `/api/v1/auth/me` | Yes | Current user |
| PUT | `/api/v1/auth/update` | Yes | Update profile |
| POST | `/api/habits` | Yes | Create habit |
| PUT | `/api/habits/:id` | Yes | Create new habit version |
| DELETE | `/api/habits/:id` | Yes | Soft delete |
| GET | `/api/habits/day/:date` | Yes | Get habits for date |
| POST | `/api/habits/:habitId/log` | Yes | Create/update log |
| GET | `/api/habits/:habitId/logs` | Yes | Get logs |
| GET | `/api/habits/:id/history` | Yes | Get habit versions |
| GET | `/api/dashboard` | Yes | Today's dashboard |
| GET | `/api/dashboard/month` | Yes | Monthly habit stats |
| GET | `/api/dashboard/month/daily` | Yes | Daily monthly stats |

---

# 33. Complete API Flow Summary

```text
AUTH
│
├── Register
│     └── JWT
│
├── Login
│     └── JWT
│
├── Me
│
└── Update Profile


HABITS
│
├── Create Habit
│
├── Get Habits By Date
│
├── Log Habit
│     └── Recalculate Streak
│
├── Get Habit Logs
│
├── Edit Habit
│     └── Create New Version
│
├── Habit History
│
└── Delete Habit


DASHBOARD
│
├── Today
│     ├── Scheduled Habits
│     ├── Completed
│     ├── Missed
│     ├── Pending
│     ├── Completion Rate
│     ├── Current Streak
│     └── Best Streak
│
├── Monthly By Habit
│
└── Monthly By Day
      └── Heatmap / Calendar
```

---

# 34. Notes for Frontend Development

### Always send the JWT

Every protected request needs:

```http
Authorization: Bearer YOUR_TOKEN
```

### Use the user's timezone

Dates are interpreted using:

```text
req.user.timezone
```

The default timezone is:

```text
Africa/Cairo
```

### Use the weekday mapping from the backend

```text
0 = Saturday
1 = Sunday
2 = Monday
3 = Tuesday
4 = Wednesday
5 = Thursday
6 = Friday
```

Do not assume JavaScript's normal `0 = Sunday` mapping when building the habit scheduling UI.

### Do not create missed logs manually unless necessary

The backend automatically handles past scheduled occurrences through `markMissedOccurrences`.

### After logging a habit

The frontend can refresh:

```text
GET /api/dashboard
```

to get updated:

- status
- progress
- streak
- completion counts

---

# 35. Development Checklist

Before connecting the frontend, verify:

- [ ] MongoDB connection works
- [ ] `/` health check works
- [ ] Register works
- [ ] Login works
- [ ] JWT authentication works
- [ ] `/auth/me` works
- [ ] Create habit works
- [ ] Default days are all 7 days
- [ ] Custom days work
- [ ] Get habits by date works
- [ ] Log `done` works
- [ ] Log `missed` works
- [ ] Non-scheduled day is rejected
- [ ] Habit logs can be retrieved
- [ ] Streak is recalculated
- [ ] Missed scheduled occurrences are created automatically
- [ ] Habit editing creates a new version
- [ ] Habit history works
- [ ] Soft delete works
- [ ] Dashboard works
- [ ] Monthly stats work
- [ ] Monthly daily stats work
- [ ] Login rate limiting works

---

## License

This project is currently a personal development project.
