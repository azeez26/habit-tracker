# Habit Tracker – Full Project Context for AI Assistants

> **Purpose of this file:** Give any AI model (ChatGPT, Claude, Gemini, Copilot, etc.) a complete, accurate snapshot of this project so it can help with modifications, bug fixes, or feature additions without needing to read every file.
>
> **Last updated:** 2026-08-19

---

## 1. What is this project?

A personal **Habit Tracker** web app. The user creates habits (e.g., "Read 30 min", "Drink 8 glasses of water"), schedules them on specific days of the week, and tracks daily progress. The app supports:

- **Two goal types:** `count` (e.g., 8 glasses) or `duration` (e.g., 1800 seconds = 30 min).
- **Flexible weekly schedule:** Each habit has an array of 7 day objects (SAT=0 → FRI=6), each can be toggled on/off with an optional per-day time.
- **Daily occurrence tracking:** Each habit generates an "occurrence" document for each scheduled day, tracking `status` (`pending` → `done` / `skipped` / `missed`) and `goal_progress` (completed vs target).
- **Retroactive logging:** Users can go back to past dates and update a habit's status. This triggers a full streak recalculation.
- **Pre-generation of occurrences:** When a habit is created or updated, occurrences are bulk-generated for the remaining days of the current month using `$setOnInsert` upserts (so existing data is never overwritten).

---

## 2. Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Runtime      | Node.js v24 (ES Modules: `"type": "module"`) |
| Framework    | Express 4                           |
| Database     | MongoDB Atlas (Mongoose 8)          |
| Auth         | JWT (jsonwebtoken) + bcryptjs       |
| AI (planned) | @google/generative-ai (Gemini SDK)  |
| Utilities    | date-fns, dotenv, cors              |
| Dev          | nodemon, `node --watch`             |

---

## 3. Project Structure

```
Habit tracker/
├── backend/
│   ├── server.js              ← Express app entry point
│   ├── package.json           ← "type": "module" (ESM)
│   ├── .env                   ← PORT, MONGO_URI, JWT_SECRET, GEMINI_API_KEY
│   │
│   ├── config/
│   │   └── db.js              ← mongoose.connect()
│   │
│   ├── models/
│   │   ├── User.js            ← ESM (import/export) — Auth user
│   │   ├── Habit.model.js     ← CJS (require/module.exports) — Habit definition
│   │   └── HabitOccurrence.model.js ← CJS — Daily occurrence/log
│   │
│   ├── controllers/
│   │   └── authController.js  ← register, login, me, updateProfile
│   │
│   ├── routes/
│   │   └── auth.js            ← /api/v1/auth/*
│   │
│   ├── middleware/
│   │   ├── auth.js            ← protect (JWT verify → req.user)
│   │   └── errorHandler.js    ← Global error handler (CastError, 11000, ValidationError, JWT)
│   │
│   ├── Services/
│   │   ├── habit.service.js   ← updateHabit, softDeleteHabit (CJS)
│   │   └── occurrence.service.js ← generateOccurrences, deleteFuturePendingOccurrences (CJS)
│   │
│   └── utils/
│       ├── appError.js        ← Custom error class (statusCode, isOperational)
│       └── catchAsync.js      ← Async error wrapper for controllers
│
└── frontend/                  ← Static HTML/CSS/JS (no framework)
    ├── index.html
    ├── css/style.css
    └── js/
        ├── api.js             ← Fetch wrapper for backend API calls
        ├── storage.js         ← Local storage manager for habits/occurrences
        └── app.js             ← Main UI controller
```

---

## 4. Database Schemas (MongoDB/Mongoose)

### 4.1 User (`models/User.js`) — ESM

```
{
  name:              String (required)
  email:             String (required, unique, lowercase, trim)
  password:          String (required, min 6) → auto-hashed via pre('save')
  avatar:            String (first letter of name, set on register)
  morningMotivation: Boolean (default: true)
  createdAt, updatedAt (auto via timestamps: true)
}
```
- `matchPassword(entered)` → bcrypt.compare
- `toJSON()` → strips password from responses

### 4.2 Habit (`models/Habit.model.js`) — CJS ⚠️

```
{
  user_id:                ObjectId → ref 'User' (required, indexed)
  name:                   String (required, trim)
  goal_type:              'duration' | 'count' (required)
  goal_duration_seconds:  Number | null  ← required if goal_type='duration'
  goal_count_target:      Number | null  ← required if goal_type='count'
  schedule: {
    fixed_time_for_all_days: Boolean (default: true)
    default_time:            String | null (e.g., "08:00")
    days: [                  ← Array of scheduleDaySchema (max 7)
      {
        day_of_week: Number (0-6)   ← 0=SAT, 1=SUN, 2=MON, 3=TUE, 4=WED, 5=THU, 6=FRI
        is_checked:  Boolean
        time:        String | null  ← per-day override
      }
    ]
  }
  is_active:   Boolean (default: true, indexed) ← soft delete flag
  created_at, updated_at (custom timestamp names)
}
```
- **Pre-validate hook:** Enforces that `goal_duration_seconds` is set when type=duration, and `goal_count_target` when type=count.
- **Exports:** `{ Habit, DAY_OF_WEEK }` where `DAY_OF_WEEK = { SAT:0, SUN:1, MON:2, TUE:3, WED:4, THU:5, FRI:6 }`

### 4.3 HabitOccurrence (`models/HabitOccurrence.model.js`) — CJS ⚠️

```
{
  habit_id:       ObjectId → ref 'Habit' (required)
  user_id:        ObjectId → ref 'User' (required)
  scheduled_date: String "YYYY-MM-DD" (required)
  scheduled_time: String "HH:mm" (required)
  status:         'pending' | 'done' | 'missed' | 'skipped' (default: 'pending')
  goal_progress: {
    type:      'duration' | 'count' (required)
    target:    Number (required) ← copied from habit at generation time
    completed: Number (default: 0)
  }
  completed_at: Date | null
  created_at, updated_at
}
```
- **Indexes:** `{ user_id, scheduled_date }` and `{ habit_id, scheduled_date }` (unique)
- **Pre-validate hook:** Ensures `completed ≤ target`

---

## 5. Day-of-Week Mapping (Critical!)

The project uses a **custom day numbering** that differs from JavaScript's `Date.getDay()`:

| Day       | JS getDay() | This project |
|-----------|:-----------:|:------------:|
| Saturday  |      6      |    **0**     |
| Sunday    |      0      |    **1**     |
| Monday    |      1      |    **2**     |
| Tuesday   |      2      |    **3**     |
| Wednesday |      3      |    **4**     |
| Thursday  |      4      |    **5**     |
| Friday    |      5      |    **6**     |

**Conversion formula:** `ourDay = (jsDate.getDay() + 1) % 7`

This is used in both `occurrence.service.js` and the frontend `storage.js`.

---

## 6. Services (Business Logic)

### 6.1 `occurrence.service.js`
- **`generateOccurrences(habit, fromDate?)`** — Generates occurrence documents from `fromDate` to the end of the current month. Uses `bulkWrite` with `$setOnInsert` upserts so existing occurrences are never overwritten.
- **`deleteFuturePendingOccurrences(habitId, fromDate?)`** — Deletes all future occurrences that are still `pending` (used before regenerating after a habit update).

### 6.2 `habit.service.js`
- **`updateHabit(habitId, updates)`** — Updates habit, deletes future pending occurrences, then regenerates them.
- **`softDeleteHabit(habitId)`** — Sets `is_active: false`, deletes future pending occurrences.

---

## 7. API Endpoints (What Exists Now)

### Auth Routes — `POST /api/v1/auth/*`

| Method | Endpoint              | Auth? | Description              |
|--------|-----------------------|:-----:|--------------------------|
| POST   | `/api/v1/auth/register` | No  | Create user, return JWT  |
| POST   | `/api/v1/auth/login`    | No  | Login, return JWT        |
| GET    | `/api/v1/auth/me`       | Yes | Get logged-in user data  |
| PUT    | `/api/v1/auth/update`   | Yes | Update name, morningMotivation |

### Habit Routes — ⚠️ NOT YET MOUNTED IN server.js

The architecture doc and models are ready, but **no habit controller or routes file exists yet**. The planned endpoints (from the architecture doc) are:

| Method | Endpoint                    | Auth? | Description                                          |
|--------|-----------------------------|:-----:|------------------------------------------------------|
| POST   | `/api/v1/habits`            | Yes   | Create a new habit + generate occurrences            |
| GET    | `/api/v1/habits/date/:date` | Yes   | Get habits for a date (merged with occurrence status)|
| POST   | `/api/v1/habits/log`        | Yes   | Upsert occurrence status + recalculate streaks       |

---

## 8. What's Incomplete / TODO

1. **Habit Controller & Routes** — Need to create `controllers/habitController.js` and `routes/habits.js`, then mount in `server.js`.
2. **Streak Recalculation** — The architecture doc describes a `recalculateStreaks(habitId)` function that fetches all logs, iterates by date, and updates cached stats on the Habit document. This function is **not implemented yet**.
3. **Stats cache on Habit model** — The architecture doc mentions an embedded `stats` object (`currentStreak`, `bestStreak`, `totalCompletions`) on the Habit document. This field does **not exist in the current schema** yet.
4. **Gemini AI integration** — `@google/generative-ai` is installed and `.env` has `GEMINI_API_KEY`/`GEMINI_MODEL` fields, but no AI code exists yet.
5. **Frontend-Backend habit sync** — The frontend currently stores habits in `localStorage`. It should call the backend API instead once habit routes exist.

---

## 9. Important Patterns & Conventions

- **Error handling:** All async controllers use `catchAsync()` wrapper. Errors are thrown as `new appError(message, statusCode)` and caught by the global `errorHandler.js`.
- **Auth pattern:** Protected routes use `protect` middleware → verifies JWT → attaches `req.user`.
- **Module mismatch ⚠️:** `package.json` has `"type": "module"` (ESM), but `models/Habit.model.js`, `models/HabitOccurrence.model.js`, and `Services/` use `require()`/`module.exports` (CJS). These files will need to be converted to ESM or imported dynamically with `createRequire()` when integrated.
- **Date format:** All dates stored as strings in `"YYYY-MM-DD"` format.
- **Soft delete:** Habits are never hard-deleted; `is_active` is set to `false`.

---

## 10. Environment Variables (.env)

```
PORT=8000
MONGO_URI=mongodb://... (MongoDB Atlas connection string)
JWT_SECRET=<64-char hex string>
JWT_EXPIRES_IN=30d
GEMINI_API_KEY=<empty, for future use>
GEMINI_MODEL=<empty, for future use>
CLIENT_URL=<empty, for production CORS origins>
```

---

## 11. How to Run

```bash
# Backend
cd backend
npm install
npm run dev          # node --watch server.js

# Frontend (static)
cd frontend
# Open index.html directly, or:
python -m http.server 3000
# Then visit http://localhost:3000
```

---

## 12. Quick Reference for AI Assistants

When asked to work on this project, keep these things in mind:

1. **Don't create dummy/mock data.** The user wants everything from the database.
2. **Day mapping starts at Saturday=0**, not Sunday=0 like JS native.
3. **CJS/ESM mismatch** in models and services — new files should use **ESM** (`import/export`) to match `package.json`.
4. **Auth is JWT Bearer token** in the `Authorization` header.
5. **The CORS config** allows any `localhost` or `127.0.0.1` origin with any port — but rejects IPv6 `[::1]`.
6. **Occurrence = daily log.** The architecture doc calls it "HabitLog" but the actual model is called "HabitOccurrence". They are the same concept.
