const PendingRegistration = require('../models/PendingRegistration')
const UserStore = require('./UserStore')

class PendingRegistrationStore {
  async hasPendingUsername(username) {
    try {
      // First check if user already exists in database - if so, clean up orphaned pending
      const userExists = await UserStore.hasUser(username)
      if (userExists) {
        await this.cleanupOrphanedForUser(username)
        return false // User exists, so no pending needed
      }
      
      const pending = await PendingRegistration.findOne({ 
        username: username.toLowerCase(),
        verificationTokenExpiry: { $gt: new Date() } // Only check non-expired
      })
      return Boolean(pending)
    } catch (error) {
      console.error('Failed to check pending username:', error)
      return false
    }
  }

  async hasPendingEmail(email) {
    try {
      if (!email) return false
      
      // First check if email already exists in database - if so, clean up orphaned pending
      const emailExists = await UserStore.hasEmail(email)
      if (emailExists) {
        await this.cleanupOrphanedForEmail(email)
        return false // Email exists, so no pending needed
      }
      
      const pending = await PendingRegistration.findOne({ 
        email: email.toLowerCase(),
        verificationTokenExpiry: { $gt: new Date() } // Only check non-expired
      })
      return Boolean(pending)
    } catch (error) {
      console.error('Failed to check pending email:', error)
      return false
    }
  }

  async addPendingRegistration(username, email, passwordHash, role, verificationToken) {
    try {
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      
      const pendingData = {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash,
        role: role || 'player',
        verificationToken,
        verificationTokenExpiry,
        createdAt: new Date()
      }
      
      // Remove existing pending registration for same username/email if exists
      await PendingRegistration.deleteMany({
        $or: [
          { username: username.toLowerCase() },
          { email: email.toLowerCase() }
        ]
      })
      
      const pending = new PendingRegistration(pendingData)
      await pending.save()
      return pending
    } catch (error) {
      console.error('Failed to add pending registration:', error)
      throw error
    }
  }

  async getPendingByToken(token) {
    try {
      const pending = await PendingRegistration.findOne({
        verificationToken: token,
        verificationTokenExpiry: { $gt: new Date() }
      })
      return pending
    } catch (error) {
      console.error('Failed to get pending registration by token:', error)
      return null
    }
  }

  async deletePendingRegistration(token) {
    try {
      await PendingRegistration.deleteOne({ verificationToken: token })
      return true
    } catch (error) {
      console.error('Failed to delete pending registration:', error)
      return false
    }
  }

  async getPendingByEmail(email) {
    try {
      const pending = await PendingRegistration.findOne({ email: email.toLowerCase() })
      return pending
    } catch (error) {
      console.error('Failed to get pending registration by email:', error)
      return null
    }
  }

  async getPendingByUsername(username) {
    try {
      const pending = await PendingRegistration.findOne({ username: username.toLowerCase() })
      return pending
    } catch (error) {
      console.error('Failed to get pending registration by username:', error)
      return null
    }
  }

  async updatePendingToken(oldToken, newToken) {
    try {
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      await PendingRegistration.updateOne(
        { verificationToken: oldToken },
        {
          $set: {
            verificationToken: newToken,
            verificationTokenExpiry
          }
        }
      )
      return true
    } catch (error) {
      console.error('Failed to update pending registration token:', error)
      return false
    }
  }

  async cleanupExpiredRegistrations() {
    try {
      const result = await PendingRegistration.deleteMany({
        verificationTokenExpiry: { $lt: new Date() }
      })
      return result.deletedCount
    } catch (error) {
      console.error('Failed to cleanup expired registrations:', error)
      return 0
    }
  }

  async cleanupExpiredForUser(username) {
    try {
      await PendingRegistration.deleteMany({
        username: username.toLowerCase(),
        verificationTokenExpiry: { $lt: new Date() }
      })
    } catch (error) {
      console.error('Failed to cleanup expired registration for user:', error)
    }
  }

  async cleanupExpiredForEmail(email) {
    try {
      await PendingRegistration.deleteMany({
        email: email.toLowerCase(),
        verificationTokenExpiry: { $lt: new Date() }
      })
    } catch (error) {
      console.error('Failed to cleanup expired registration for email:', error)
    }
  }

  async cleanupOrphanedRegistrations() {
    try {
      // Get all pending registrations
      const pendingRegs = await PendingRegistration.find({})
      
      for (const pending of pendingRegs) {
        // Check if user already exists in database
        const userExists = await UserStore.hasUser(pending.username) || 
                          await UserStore.hasEmail(pending.email)
        
        if (userExists) {
          // Delete orphaned pending registration (user already created)
          await PendingRegistration.deleteOne({ _id: pending._id })
        }
      }
    } catch (error) {
      console.error('Failed to cleanup orphaned registrations:', error)
    }
  }

  async cleanupOrphanedForUser(username) {
    try {
      await PendingRegistration.deleteMany({
        username: username.toLowerCase()
      })
    } catch (error) {
      console.error('Failed to cleanup orphaned registration for user:', error)
    }
  }

  async cleanupOrphanedForEmail(email) {
    try {
      await PendingRegistration.deleteMany({
        email: email.toLowerCase()
      })
    } catch (error) {
      console.error('Failed to cleanup orphaned registration for email:', error)
    }
  }
}

module.exports = new PendingRegistrationStore()

