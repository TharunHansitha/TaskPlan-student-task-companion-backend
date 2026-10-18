const Task = require('../models/Task')

// @desc    Get all tasks for logged-in user
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const { status, priority, subject, date, search, sort, page = 1, limit = 100 } = req.query

    // Build filter
    const filter = { user: req.user._id }

    if (status)   filter.status   = status
    if (priority) filter.priority = priority
    if (subject)  filter.subject  = { $regex: subject, $options: 'i' }

    // Filter by specific date
    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      filter.dueDate = { $gte: start, $lte: end }
    }

    // Search by title or description
    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subject:     { $regex: search, $options: 'i' } },
      ]
    }

    // Build sort
    let sortOption = {}
    switch (sort) {
      case 'priority':
        const priorityOrder = { high: 1, medium: 2, low: 3 }
        sortOption = { priority: 1 }
        break
      case 'createdAt':
        sortOption = { createdAt: -1 }
        break
      default:
        sortOption = { dueDate: 1 }
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [tasks, total] = await Promise.all([
      Task.find(filter).sort(sortOption).skip(skip).limit(Number(limit)),
      Task.countDocuments(filter),
    ])

    res.json({
      success: true,
      count: tasks.length,
      total,
      page: Number(page),
      tasks,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id })
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' })
    }
    res.json({ success: true, task })
  } catch (error) {
    next(error)
  }
}

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res, next) => {
  try {
    const { title, description, subject, dueDate, priority, status, tags } = req.body

    // Auto-calculate notification times (24h and 1h before due)
    const due = new Date(dueDate)
    const notifyAt = []
    const minus24h = new Date(due.getTime() - 24 * 60 * 60 * 1000)
    const minus1h  = new Date(due.getTime() - 60 * 60 * 1000)
    if (minus24h > new Date()) notifyAt.push(minus24h)
    if (minus1h  > new Date()) notifyAt.push(minus1h)

    const task = await Task.create({
      user: req.user._id,
      title,
      description,
      subject,
      dueDate: due,
      priority: priority || 'medium',
      status:   status   || 'todo',
      tags:     tags     || [],
      notifyAt,
    })

    res.status(201).json({ success: true, message: 'Task created', task })
  } catch (error) {
    next(error)
  }
}

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id })
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' })
    }

    const allowedFields = ['title', 'description', 'subject', 'dueDate', 'priority', 'status', 'tags']
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) task[field] = req.body[field]
    })

    // Recalculate notification times if dueDate changed
    if (req.body.dueDate) {
      const due = new Date(req.body.dueDate)
      const notifyAt = []
      const minus24h = new Date(due.getTime() - 24 * 60 * 60 * 1000)
      const minus1h  = new Date(due.getTime() - 60 * 60 * 1000)
      if (minus24h > new Date()) notifyAt.push(minus24h)
      if (minus1h  > new Date()) notifyAt.push(minus1h)
      task.notifyAt = notifyAt
      task.notificationSent = false
    }

    await task.save()
    res.json({ success: true, message: 'Task updated', task })
  } catch (error) {
    next(error)
  }
}

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' })
    }
    res.json({ success: true, message: 'Task deleted' })
  } catch (error) {
    next(error)
  }
}

// @desc    Get task statistics for the current user
// @route   GET /api/tasks/stats
// @access  Private
const getStats = async (req, res, next) => {
  try {
    const userId = req.user._id
    const now = new Date()
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)

    const [
      total,
      done,
      overdue,
      doneThisWeek,
      byPriority,
      bySubject,
      byStatus,
    ] = await Promise.all([
      Task.countDocuments({ user: userId }),
      Task.countDocuments({ user: userId, status: 'done' }),
      Task.countDocuments({ user: userId, status: { $ne: 'done' }, dueDate: { $lt: now } }),
      Task.countDocuments({ user: userId, status: 'done', completedAt: { $gte: weekAgo } }),
      Task.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { user: userId, subject: { $ne: '' } } },
        { $group: { _id: '$subject', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      Task.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ])

    res.json({
      success: true,
      stats: {
        total,
        done,
        overdue,
        doneThisWeek,
        completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
        byPriority: byPriority.reduce((acc, p) => { acc[p._id] = p.count; return acc }, {}),
        bySubject:  bySubject.map(s => ({ subject: s._id, count: s.count })),
        byStatus:   byStatus.reduce((acc, s) => { acc[s._id] = s.count; return acc }, {}),
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Delete all completed tasks
// @route   DELETE /api/tasks/completed
// @access  Private
const clearCompleted = async (req, res, next) => {
  try {
    const result = await Task.deleteMany({ user: req.user._id, status: 'done' })
    res.json({ success: true, message: `Deleted ${result.deletedCount} completed tasks` })
  } catch (error) {
    next(error)
  }
}

module.exports = { getTasks, getTaskById, createTask, updateTask, deleteTask, getStats, clearCompleted }
