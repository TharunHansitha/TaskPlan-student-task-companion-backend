# TaskPlan — Backend API

Node.js + Express + MongoDB REST API for the Student Life Companion project.

---

## Quick start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` and fill in your values:
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/taskplan
JWT_SECRET=any_long_random_string_here
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 3. Seed the database (optional)
```bash
npm run seed
```
Creates demo users and sample tasks.

### 4. Start the server
```bash
npm run dev      # development with nodemon (auto-restart)
npm start        # production
```

Server runs at: **http://localhost:5000**  
Health check: **http://localhost:5000/health**

---

## MongoDB Atlas setup (free)

1. Go to https://www.mongodb.com/cloud/atlas and create a free account
2. Create a **free M0 cluster**
3. Under **Database Access** → Add a database user (username + password)
4. Under **Network Access** → Add IP Address → Allow access from anywhere (`0.0.0.0/0`)
5. Click **Connect** → **Connect your application** → Copy the connection string
6. Paste it into your `.env` as `MONGO_URI` (replace `<password>` with your actual password)

---

## Project structure

```
taskplan-backend/
├── server.js                  ← Entry point
├── src/
│   ├── config/
│   │   └── db.js              ← MongoDB connection
│   ├── controllers/
│   │   ├── authController.js  ← Register, login, profile
│   │   └── taskController.js  ← Full CRUD + stats
│   ├── middleware/
│   │   ├── auth.js            ← JWT protect middleware
│   │   ├── errorHandler.js    ← Global error handler
│   │   └── validate.js        ← express-validator rules
│   ├── models/
│   │   ├── User.js            ← User schema (bcrypt, JWT)
│   │   └── Task.js            ← Task schema (virtuals, indexes)
│   ├── routes/
│   │   ├── authRoutes.js      ← /api/auth/*
│   │   └── taskRoutes.js      ← /api/tasks/*
│   └── utils/
│       ├── rateLimiter.js     ← express-rate-limit config
│       └── seed.js            ← Demo data seeder
└── .env.example
```

---

## API Reference

### Auth endpoints

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Login + get token |
| GET | `/api/auth/me` | Private | Get current user |
| PUT | `/api/auth/me` | Private | Update name/avatar |
| PUT | `/api/auth/password` | Private | Change password |
| POST | `/api/auth/push-subscribe` | Private | Save push subscription |

### Task endpoints

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/tasks` | Private | Get all tasks (with filters) |
| POST | `/api/tasks` | Private | Create task |
| GET | `/api/tasks/stats` | Private | Get task statistics |
| GET | `/api/tasks/:id` | Private | Get single task |
| PUT | `/api/tasks/:id` | Private | Update task |
| DELETE | `/api/tasks/:id` | Private | Delete task |
| DELETE | `/api/tasks/completed` | Private | Delete all done tasks |

### Query parameters for GET /api/tasks

| Param | Example | Description |
|-------|---------|-------------|
| status | `?status=todo` | Filter by status |
| priority | `?priority=high` | Filter by priority |
| subject | `?subject=Math` | Filter by subject |
| date | `?date=2026-06-15` | Tasks due on date |
| search | `?search=lab` | Search title/description |
| sort | `?sort=dueDate` | Sort: dueDate, priority, createdAt |

### Example request bodies

**Register**
```json
{ "name": "Jane Smith", "email": "jane@uni.edu", "password": "secret123" }
```

**Login**
```json
{ "email": "jane@uni.edu", "password": "secret123" }
```

**Create task**
```json
{
  "title": "Submit lab report",
  "subject": "Chemistry",
  "description": "Write up the esterification results",
  "dueDate": "2026-06-15T23:59:00.000Z",
  "priority": "high",
  "status": "todo"
}
```

### Auth header (for private routes)
```
Authorization: Bearer <your_jwt_token>
```

---

## Demo credentials (after running seed)

| Role | Email | Password |
|------|-------|----------|
| Student | demo@university.edu | demo123 |
| Admin | admin@university.edu | admin123 |

---

## Deploy to Render (free)

1. Push code to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Set these:
   - **Build command:** `npm install`
   - **Start command:** `node server.js`
5. Add environment variables from your `.env`
6. Click **Deploy**

Your backend URL will be something like: `https://taskplan-api.onrender.com`  
Update `VITE_API_URL` in your frontend `.env` to match.
