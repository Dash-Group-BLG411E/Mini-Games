const User = require('../models/User')

class UserStore {
  generateDefaultAvatar(username) {
    // Generate a simple emoji-based avatar from first letter
    const emojis = ['😀', '😃', '😄', '😁', '😆', '😊', '😎', '🤓', '🧐', '😇']
    const index = username.charCodeAt(0) % emojis.length
    return emojis[index]
  }

  async hasUser(username) {
    try {
      const user = await User.findOne({ username: username.toLowerCase() })
      return Boolean(user)
    } catch (error) {
      console.error('Failed to check user:', error)
      return false
    }
  }

  async getUser(username) {
    try {
      const user = await User.findOne({ username: username.toLowerCase() })
      if (!user) return null
      
      // Convert to plain object similar to old format
      return {
        username: user.username,
        passwordHash: user.passwordHash,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role || 'player',
        createdAt: user.createdAt.toISOString()
      }
    } catch (error) {
      console.error('Failed to get user:', error)
      return null
    }
  }

  async addUser(username, passwordHash, role = 'player') {
    try {
      const avatar = this.generateDefaultAvatar(username)
      const allowedRoles = ['admin', 'player', 'guest']
      const safeRole = allowedRoles.includes(role) ? role : 'player'
      const user = new User({
        username: username.toLowerCase(),
        passwordHash,
        displayName: username,
        avatar,
        role: safeRole
      })
      await user.save()
      return user
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error
        throw new Error('Username already exists')
      }
      console.error('Failed to add user:', error)
      throw error
    }
  }

  async updateUser(username, updates) {
    try {
      // Don't allow changing username
      const { username: _, ...safeUpdates } = updates
      
      const user = await User.findOneAndUpdate(
        { username: username.toLowerCase() },
        { $set: safeUpdates },
        { new: true }
      )
      
      if (!user) {
        return false
      }
      
      return true
    } catch (error) {
      console.error('Failed to update user:', error)
      return false
    }
  }

  async deleteUser(username) {
    try {
      const result = await User.deleteOne({ username: username.toLowerCase() })
      return result.deletedCount > 0
    } catch (error) {
      console.error('Failed to delete user:', error)
      return false
    }
  }
}

module.exports = new UserStore()

