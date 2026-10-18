require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../models/User')
const Task = require('../models/Task')

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('✅ MongoDB connected for seeding')
}

const users = [
  { name: 'Demo Student', email: 'demo@university.edu', password: 'demo123', role: 'student' },
  { name: 'Admin User',   email: 'admin@university.edu', password: 'admin123', role: 'admin' },
]

const now = Date.now()
const day = 86400000

const getTasks = (userId) => [
  {
    user: userId, title: 'Submit data structures assignment',
    subject: 'Computer Science', description: 'Implement a binary search tree with insert, delete, and traversal.',
    dueDate: new Date(now - day), priority: 'high', status: 'todo',
  },
  {
    user: userId, title: 'Read Chapter 7 — Calculus',
    subject: 'Mathematics', description: 'Cover integration techniques and practice end-of-chapter problems.',
    dueDate: new Date(now + 2 * day), priority: 'medium', status: 'in-progress',
  },
  {
    user: userId, title: 'Group presentation slides',
    subject: 'Business Studies', description: 'Prepare slides for the marketing strategy presentation.',
    dueDate: new Date(now + 5 * day), priority: 'medium', status: 'todo',
  },
  {
    user: userId, title: 'Lab report — organic reactions',
    subject: 'Chemistry', description: "Write up the results from last week's lab session on esterification.",
    dueDate: new Date(now + day), priority: 'high', status: 'todo',
  },
  {
    user: userId, title: 'Essay — The French Revolution',
    subject: 'History', description: 'Analyze the causes and consequences in 1500 words.',
    dueDate: new Date(now + 7 * day), priority: 'low', status: 'done',
    completedAt: new Date(now - 2 * day),
  },
  {
    user: userId, title: 'Physics problem set 4',
    subject: 'Physics', description: 'Complete questions 1-20 on electromagnetic induction.',
    dueDate: new Date(now + 3 * day), priority: 'medium', status: 'todo',
  },
  {
    user: userId, title: 'Economics quiz revision',
    subject: 'Economics', description: 'Review chapters 3 and 4 on supply, demand and market equilibrium.',
    dueDate: new Date(now + 4 * day), priority: 'high', status: 'in-progress',
  },
  {
    user: userId, title: 'English literature response paper',
    subject: 'English', description: 'Write a 500-word response to the assigned poem collection.',
    dueDate: new Date(now + 6 * day), priority: 'low', status: 'todo',
  },
]

const seed = async () => {
  try {
    await connectDB()

    // Clear existing data
    await User.deleteMany({})
    await Task.deleteMany({})
    console.log('🗑️  Cleared existing data')

    // Create users
    const createdUsers = await User.insertMany(users)
    console.log(`👤 Created ${createdUsers.length} users`)

    // Create tasks for demo student
    const demoUser = createdUsers.find(u => u.email === 'demo@university.edu')
    const tasks = getTasks(demoUser._id)
    await Task.insertMany(tasks)
    console.log(`✅ Created ${tasks.length} tasks`)

    console.log('\n🎉 Seed complete!')
    console.log('──────────────────────────────')
    console.log('Demo login:  demo@university.edu  / demo123')
    console.log('Admin login: admin@university.edu / admin123')
    console.log('──────────────────────────────')

    process.exit(0)
  } catch (err) {
    console.error('❌ Seed error:', err)
    process.exit(1)
  }
}

seed()
