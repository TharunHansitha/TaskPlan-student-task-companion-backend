const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    subject: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Subject cannot exceed 100 characters'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Priority must be low, medium, or high',
      },
      default: 'medium',
    },
    status: {
      type: String,
      enum: {
        values: ['todo', 'in-progress', 'done'],
        message: 'Status must be todo, in-progress, or done',
      },
      default: 'todo',
    },
    completedAt: {
      type: Date,
      default: null,
    },
    notifyAt: {
      type: [Date],
      default: [],
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Virtual: isOverdue
taskSchema.virtual('isOverdue').get(function () {
  if (this.status === 'done') return false
  return this.dueDate < new Date()
})

// Auto-set completedAt when status becomes 'done'
taskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'done' && !this.completedAt) {
      this.completedAt = new Date()
    } else if (this.status !== 'done') {
      this.completedAt = null
    }
  }
  next()
})

taskSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate()
  if (update.status === 'done') {
    update.completedAt = new Date()
  } else if (update.status && update.status !== 'done') {
    update.completedAt = null
  }
  next()
})

// Indexes for common queries
taskSchema.index({ user: 1, dueDate: 1 })
taskSchema.index({ user: 1, status: 1 })
taskSchema.index({ user: 1, priority: 1 })
taskSchema.index({ user: 1, subject: 1 })

module.exports = mongoose.model('Task', taskSchema)
