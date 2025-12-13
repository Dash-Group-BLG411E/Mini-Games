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
        email: user.email,
        passwordHash: user.passwordHash,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role || 'player',
        emailVerified: user.emailVerified || false,
        createdAt: user.createdAt.toISOString()
      }
    } catch (error) {
      console.error('Failed to get user:', error)
      return null
    }
  }

  async getUserByEmail(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() })
      if (!user) return null
      
      return {
        username: user.username,
        email: user.email,
        passwordHash: user.passwordHash,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role || 'player',
        emailVerified: user.emailVerified || false,
        createdAt: user.createdAt.toISOString()
      }
    } catch (error) {
      console.error('Failed to get user by email:', error)
      return null
    }
  }

  async hasEmail(email) {
    try {
      if (!email) return false
      const user = await User.findOne({ email: email.toLowerCase() })
      return Boolean(user)
    } catch (error) {
      console.error('Failed to check email:', error)
      return false
    }
  }

  async addUser(username, email, passwordHash, role = 'player', verificationToken = null) {
    try {
      const avatar = this.generateDefaultAvatar(username)
      const allowedRoles = ['admin', 'player', 'guest']
      const safeRole = allowedRoles.includes(role) ? role : 'player'
      
      // Set token expiry to 24 hours from now
      const verificationTokenExpiry = verificationToken ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null
      
      // For guest accounts, email can be null
      const userData = {
        username: username.toLowerCase(),
        passwordHash,
        displayName: username,
        avatar,
        role: safeRole,
        emailVerified: safeRole === 'guest', // Guests are auto-verified
        verificationToken: safeRole === 'guest' ? null : verificationToken,
        verificationTokenExpiry: safeRole === 'guest' ? null : verificationTokenExpiry
      }
      
      // Only add email if provided and not a guest
      // For guests, explicitly don't set email (undefined) to avoid index issues
      if (email && safeRole !== 'guest') {
        userData.email = email.toLowerCase()
      } else if (safeRole === 'guest') {
        // Explicitly set to undefined (not null) for guests to avoid index conflicts
        userData.email = undefined
      }
      
      const user = new User(userData)
      await user.save()
      return user
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error - check which field
        if (error.keyPattern?.username) {
          throw new Error('Username already exists')
        } else if (error.keyPattern?.email) {
          throw new Error('Email already registered')
        }
        throw new Error('Username or email already exists')
      }
      console.error('Failed to add user:', error)
      throw error
    }
  }

  async verifyEmail(token) {
    try {
      const user = await User.findOne({ 
        verificationToken: token,
        verificationTokenExpiry: { $gt: new Date() }
      })
      
      if (!user) {
        return { success: false, error: 'Invalid or expired verification token' }
      }
      
      user.emailVerified = true
      user.verificationToken = null
      user.verificationTokenExpiry = null
      await user.save()
      
      return { success: true, user }
    } catch (error) {
      console.error('Failed to verify email:', error)
      return { success: false, error: 'Failed to verify email' }
    }
  }

  async updateVerificationToken(username, token) {
    try {
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      const user = await User.findOneAndUpdate(
        { username: username.toLowerCase() },
        { 
          $set: { 
            verificationToken: token,
            verificationTokenExpiry
          }
        },
        { new: true }
      )
      return user
    } catch (error) {
      console.error('Failed to update verification token:', error)
      return null
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

