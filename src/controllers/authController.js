const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  })
}

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body

    // Check if user already exists
    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' })
    }

    // Create user
    const user = await User.create({ name, email, password })
    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: user.toSafeObject(),
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Find user with password
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    const token = generateToken(user._id)

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toSafeObject(),
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    res.json({ success: true, user: user.toSafeObject() })
  } catch (error) {
    next(error)
  }
}

// @desc    Update profile (name, avatar)
// @route   PUT /api/auth/me
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...(name && { name }), ...(avatar && { avatar }) },
      { new: true, runValidators: true }
    )
    res.json({ success: true, user: user.toSafeObject() })
  } catch (error) {
    next(error)
  }
}

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await User.findById(req.user._id).select('+password')
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' })
    }

    user.password = newPassword
    await user.save()

    res.json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    next(error)
  }
}

// @desc    Save push notification subscription
// @route   POST /api/auth/push-subscribe
// @access  Private
const savePushSubscription = async (req, res, next) => {
  try {
    const { subscription } = req.body
    await User.findByIdAndUpdate(req.user._id, {
      pushSubscription: subscription,
      notificationsEnabled: true,
    })
    res.json({ success: true, message: 'Push subscription saved' })
  } catch (error) {
    next(error)
  }
}

module.exports = { register, login, getMe, updateProfile, changePassword, savePushSubscription }
