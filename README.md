# Habit Tracker App

A free, open-source habit tracking application with timezone-aware scheduling and comprehensive analytics.

## Architecture

This project has two main parts:

- **Backend**: Node.js + Express + MongoDB (Complete)
- **Frontend**: React/Angular (Coming Soon)

---

## BACKEND

### Overview

RESTful API for tracking daily habits with:
- Timezone-aware user system
- Flexible habit scheduling
- Two goal types: Duration-based and Count-based
- Streak calculation and statistics
- Monthly and daily analytics
- JWT authentication

### Tech Stack

- Node.js v18+
- Express.js 4.21
- MongoDB 6+
- Mongoose 8.6
- JWT + bcryptjs
- Joi validation
- date-fns + date-fns-tz
- express-rate-limit

### Quick Start

**Prerequisites**
```
Node.js v18+
MongoDB (local or Atlas)
npm or yarn
```

**Installation**
```bash
git clone https://github.com/azeez26/habit-tracker.git
cd habit-tracker/backend
npm install
```

**Environment Variables** (.env)
```
PORT=8000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/habit-tracker
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:3000
```

**Start Server**
```bash
npm run dev        # Development
npm start          # Production
```

Server runs on: http://localhost:8000

---

## API Documentation

### Base URL
```
http://localhost:8000/api
```

### Authentication
All protected endpoints require JWT in header:
```
Authorization: Bearer YOUR_TOKEN
```

### Auth Endpoints

**Register**
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
```

**Login**
```
POST /v1/auth/login

{
  "email": "ahmed@example.com",
  "password": "secure123"
}
```

**Get Current User**
```
GET /v1/auth/me
```

**Update Profile**
```
PUT /v1/auth/update

{
  "name": "Ahmed Updated",
  "timezone": "Asia/Dubai",
  "language": "en"
}
```

### Habit Endpoints

**Create Habit**
```
POST /habits

{
  "name": "Exercise",
  "goal_type": "duration",    // "duration" or "count"
  "goal_target": 30,          // minutes or reps
  "days": [0, 2, 4, 6],       // Saturday, Monday, Wednesday, Friday
  "time": "07:00"             // Optional
}
```

Days convention:
- 0 = Saturday
- 1 = Sunday
- 2 = Monday
- 3 = Tuesday
- 4 = Wednesday
- 5 = Thursday
- 6 = Friday

**Get Habits for a Day**
```
GET /habits/day/2026-08-25
```

**Update Habit**
```
PUT /habits/:habitId

{
  "name": "Exercise Updated",
  "goal_target": 45,
  "days": [0, 1, 2, 3, 4, 5, 6]
}
```

**Delete Habit**
```
DELETE /habits/:habitId
```

**Get Habit History**
```
GET /habits/:habitId/history
```

### Habit Logging

**Log a Habit**
```
POST /habits/:habitId/log

{
  "date": "2026-08-25",
  "status": "done",           // "done" or "missed"
  "progress_value": 25        // Optional
}
```

**Get Habit Logs**
```
GET /habits/:habitId/logs?fromDate=2026-08-01&toDate=2026-08-31
```

### Dashboard Endpoints

**Today's Dashboard**
```
GET /dashboard
```

Returns daily stats including:
- Habits completed today
- Current and best streaks
- Completion percentage

**Monthly Stats (by Habit)**
```
GET /dashboard/month?month=2026-08
```

**Monthly Stats (by Day)**
```
GET /dashboard/month/daily?month=2026-08
```

Use for heatmap or calendar visualization.

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

Status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Server Error

---

## Security

- JWT authentication with 30-day expiring tokens
- Password hashing with bcryptjs
- User ownership verification (IDOR protection)
- Rate limiting on login endpoints
- Input validation with Joi schemas
- CORS enabled and configurable
- Soft delete for data preservation

---

## Project Structure

```
backend/
├── src/
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   ├── Services/
│   ├── middleware/
│   ├── utils/
│   ├── validations/
│   ├── config/
│   └── server.js
├── package.json
├── .env
└── .gitignore
```

---

## Testing

Manual testing with curl:

```bash
# Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "timezone": "Africa/Cairo"
  }'

# Create Habit
curl -X POST http://localhost:8000/api/habits \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Morning Run",
    "goal_type": "duration",
    "goal_target": 30,
    "days": [0, 2, 4, 6]
  }'

# Get Dashboard
curl -X GET http://localhost:8000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Deployment

Production requirements:
- Set NODE_ENV=production
- Use MongoDB Atlas for database
- Generate strong JWT_SECRET
- Configure CORS for frontend domain
- Enable HTTPS
- Set appropriate rate limiting
- Configure error logging
- Test all endpoints

---

## Frontend (Coming Soon)

Frontend section will include:
- React/Angular setup
- Component structure
- State management
- API integration
- UI components
- Heatmap visualization

---

## API Quick Reference

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /v1/auth/register | No | Create account |
| POST | /v1/auth/login | No | Login |
| GET | /v1/auth/me | Yes | Get profile |
| PUT | /v1/auth/update | Yes | Update profile |
| POST | /habits | Yes | Create habit |
| PUT | /habits/:id | Yes | Update habit |
| DELETE | /habits/:id | Yes | Delete habit |
| GET | /habits/day/:date | Yes | Get day habits |
| GET | /habits/:id/history | Yes | Habit versions |
| POST | /habits/:id/log | Yes | Log habit |
| GET | /habits/:id/logs | Yes | Get logs |
| GET | /dashboard | Yes | Today stats |
| GET | /dashboard/month | Yes | Month stats |
| GET | /dashboard/month/daily | Yes | Daily stats |

---

## Contributing

1. Fork the repository
2. Create feature branch (git checkout -b feature/feature-name)
3. Commit changes (git commit -m 'Add feature')
4. Push to branch (git push origin feature/feature-name)
5. Open Pull Request

---

## License

MIT License

---

Last Updated: August 2026
Backend Status: Production Ready
Frontend Status: Coming Soon
