require('dotenv').config()
const express  = require('express')
const cors     = require('cors')
const helmet   = require('helmet')
const morgan   = require('morgan')
const connectDB = require('./src/config/db')
const authRoutes = require('./src/routes/authRoutes')
const taskRoutes = require('./src/routes/taskRoutes')
const { errorHandler, notFound } = require('./src/middleware/errorHandler')
const { apiLimiter, authLimiter } = require('./src/utils/rateLimiter')

// Connect to MongoDB
connectDB()

const app = express()

// ── Security middleware ──────────────────────────────────────
app.use(helmet())

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── General middleware ───────────────────────────────────────
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true }))

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// ── Rate limiting ────────────────────────────────────────────
app.use('/api/', apiLimiter)
app.use('/api/auth/login',    authLimiter)
app.use('/api/auth/register', authLimiter)

// ── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth',  authRoutes)
app.use('/api/tasks', taskRoutes)

// ── Error handling ───────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ── Start server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`\n🚀 TaskPlan API running on port ${PORT}`)
  console.log(`📍 Environment : ${process.env.NODE_ENV || 'development'}`)
  console.log(`🌐 Client URL  : ${process.env.CLIENT_URL || 'http://localhost:5173'}`)
  console.log(`💡 Health check: http://localhost:${PORT}/health\n`)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message)
  process.exit(1)
})
