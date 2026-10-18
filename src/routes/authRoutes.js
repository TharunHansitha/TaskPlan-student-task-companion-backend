const express = require('express')
const router  = express.Router()
const { register, login, getMe, updateProfile, changePassword, savePushSubscription } = require('../controllers/authController')
const { protect } = require('../middleware/auth')
const { validate, registerRules, loginRules } = require('../middleware/validate')

// Public
router.post('/register', registerRules, validate, register)
router.post('/login',    loginRules,    validate, login)

// Private
router.get('/me',              protect, getMe)
router.put('/me',              protect, updateProfile)
router.put('/password',        protect, changePassword)
router.post('/push-subscribe', protect, savePushSubscription)

module.exports = router
