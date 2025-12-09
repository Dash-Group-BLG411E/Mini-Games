const express = require('express')
const bcrypt = require('bcryptjs')
const UserStore = require('./UserStore')
const { generateToken } = require('./authUtils')
const { requireAuth } = require('./authMiddleware')

const authRouter = express.Router()
const allowedRegistrationRoles = ['player', 'guest']

/**
 * Validates password according to project requirements.
 * @param {string} password - The password to validate
 * @returns {string|null} - Error message if validation fails, null if valid
 */
function validatePassword(password) {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long'
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    return 'Password must contain at least one letter'
  }
  
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number'
  }
  
  // Check for forbidden special characters
  const forbiddenChars = /[!@#$%^&*(),.'"?/]/
  if (forbiddenChars.test(password)) {
    return 'Password cannot contain special characters (! @ # $ % ^ & * ( ) , . \' " ? /)'
  }
  
  return null
}

authRouter.post('/register', async (req, res) => {
  const { username, password, role: requestedRole } = req.body || {}

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' })
  }

  if (await UserStore.hasUser(username)) {
    return res.status(400).json({ error: 'Username is already registered' })
  }

  // Validate password requirements
  const passwordError = validatePassword(password)
  if (passwordError) {
    return res.status(400).json({ error: passwordError })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  try {
    const role = allowedRegistrationRoles.includes((requestedRole || '').toLowerCase())
      ? requestedRole.toLowerCase()
      : 'player'

    await UserStore.addUser(username, passwordHash, role)
    const token = generateToken({ username, role })
    res.json({ username, role, token })
  } catch (error) {
    if (error.message === 'Username already exists') {
      return res.status(400).json({ error: 'Username is already registered' })
    }
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Failed to register user' })
  }
})

authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body || {}

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' })
  }

  const user = await UserStore.getUser(username)
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' })
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash)
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid username or password' })
  }

  const token = generateToken({ username: user.username, role: user.role })
  res.json({ username: user.username, role: user.role, token })
})

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await UserStore.getUser(req.user.username)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  
  // Return user data without password hash
  const { passwordHash, ...userData } = user
  res.json(userData)
})

authRouter.put('/profile', requireAuth, async (req, res) => {
  const { displayName, avatar } = req.body || {}
  const username = req.user.username
  
  const updates = {}
  if (displayName !== undefined) {
    if (typeof displayName === 'string' && displayName.trim().length > 0) {
      updates.displayName = displayName.trim()
    } else {
      return res.status(400).json({ error: 'Display name must be a non-empty string' })
    }
  }
  
  if (avatar !== undefined) {
    if (typeof avatar === 'string' && avatar.trim().length > 0) {
      updates.avatar = avatar.trim()
    } else {
      return res.status(400).json({ error: 'Avatar must be a non-empty string' })
    }
  }
  
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' })
  }
  
  const success = await UserStore.updateUser(username, updates)
  if (!success) {
    return res.status(404).json({ error: 'User not found' })
  }
  
  const user = await UserStore.getUser(username)
  const { passwordHash, ...userData } = user
  res.json(userData)
})

authRouter.put('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {}
  const username = req.user.username
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' })
  }
  
  // Validate password requirements
  const passwordError = validatePassword(newPassword)
  if (passwordError) {
    return res.status(400).json({ error: passwordError })
  }
  
  const user = await UserStore.getUser(username)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  
  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isMatch) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }
  
  const newPasswordHash = await bcrypt.hash(newPassword, 10)
  await UserStore.updateUser(username, { passwordHash: newPasswordHash })
  
  res.json({ message: 'Password updated successfully' })
})

authRouter.delete('/account', requireAuth, async (req, res) => {
  const username = req.user.username
  
  const success = await UserStore.deleteUser(username)
  if (!success) {
    return res.status(404).json({ error: 'User not found' })
  }
  
  res.json({ message: 'Account deleted successfully' })
})

module.exports = authRouter

