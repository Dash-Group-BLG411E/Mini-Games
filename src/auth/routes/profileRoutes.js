const bcrypt = require('bcryptjs')
const UserStore = require('../UserStore')
const { requireAuth } = require('../authMiddleware')
const { validatePassword } = require('../passwordValidator')

function createProfileRoutes() {
  const router = require('express').Router()

  router.get('/me', requireAuth, async (req, res) => {
    const user = await UserStore.getUser(req.user.username)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const { passwordHash, ...userData } = user
    res.json(userData)
  })

  router.put('/profile', requireAuth, async (req, res) => {
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

  router.put('/password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body || {}
    const username = req.user.username
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' })
    }
    
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

  router.delete('/account', requireAuth, async (req, res) => {
    const username = req.user.username
    
    const success = await UserStore.deleteUser(username)
    if (!success) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    res.json({ message: 'Account deleted successfully' })
  })

  return router
}

module.exports = createProfileRoutes
