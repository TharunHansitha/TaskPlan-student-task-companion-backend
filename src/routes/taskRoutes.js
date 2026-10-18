const express = require('express')
const router  = express.Router()
const {
  getTasks, getTaskById, createTask, updateTask, deleteTask, getStats, clearCompleted
} = require('../controllers/taskController')
const { protect } = require('../middleware/auth')
const { validate, taskRules } = require('../middleware/validate')

// All routes are protected
router.use(protect)

router.get('/stats',      getStats)
router.delete('/completed', clearCompleted)

router.route('/')
  .get(getTasks)
  .post(taskRules, validate, createTask)

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask)

module.exports = router
