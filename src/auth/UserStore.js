const User = require('../models/User')

class UserStore {
  generateDefaultAvatar(username) {
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

  async addUser(username, email, passwordHash, role = 'player', verificationToken = null, emailVerified = false) {
    try {
      const avatar = this.generateDefaultAvatar(username)
      const allowedRoles = ['admin', 'player', 'guest']
      const safeRole = allowedRoles.includes(role) ? role : 'player'
      
      const verificationTokenExpiry = verificationToken ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null
      
      // If verificationToken is null and email is provided, user is already verified
      const isVerified = emailVerified || safeRole === 'guest' || (verificationToken === null && email)
      
      const userData = {
        username: username.toLowerCase(),
        passwordHash,
        displayName: username,
        avatar,
        role: safeRole,
        emailVerified: isVerified,
        verificationToken: safeRole === 'guest' ? null : verificationToken,
        verificationTokenExpiry: safeRole === 'guest' ? null : verificationTokenExpiry
      }
      
      if (email && safeRole !== 'guest') {
        userData.email = email.toLowerCase()
      } else if (safeRole === 'guest') {
        userData.email = undefined
      }
      
      const user = new User(userData)
      await user.save()
      return user
    } catch (error) {
      if (error.code === 11000) {
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
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
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
      if (result.deletedCount > 0) {
        // Also delete user's game stats
        const GameStats = require('../models/GameStats')
        await GameStats.deleteOne({ username: username.toLowerCase() })
        console.log(`✅ Deleted user ${username} and their game stats`)
      }
      return result.deletedCount > 0
    } catch (error) {
      console.error('Failed to delete user:', error)
      return false
    }
  }
}

module.exports = new UserStore()

