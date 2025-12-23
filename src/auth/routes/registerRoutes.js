const bcrypt = require('bcryptjs')
const UserStore = require('../UserStore')
const PendingRegistrationStore = require('../PendingRegistrationStore')
const { generateToken } = require('../authUtils')
const emailService = require('../emailService')
const { validatePassword } = require('../passwordValidator')

const allowedRegistrationRoles = ['player', 'guest']

function createRegisterRoutes() {
  const router = require('express').Router()

  router.post('/register', async (req, res) => {
    const { username, email, password, role: requestedRole } = req.body || {}
    const role = allowedRegistrationRoles.includes((requestedRole || '').toLowerCase())
      ? requestedRole.toLowerCase()
      : 'player'

    const isGuest = role === 'guest'

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    if (!isGuest && !email) {
      return res.status(400).json({ error: 'Email is required for registration' })
    }

    if (!isGuest) {
      const emailRegex = /^\S+@\S+\.\S+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address' })
      }
    }

    // Check if username exists in database OR pending registrations
    if (await UserStore.hasUser(username)) {
      return res.status(400).json({ error: 'Username is already registered' })
    }

    // Clean up expired pending registrations for this username
    await PendingRegistrationStore.cleanupExpiredForUser(username)

    if (await PendingRegistrationStore.hasPendingUsername(username)) {
      return res.status(400).json({ error: 'A verification email has already been sent for this username. Please check your email.' })
    }

    // Check if email exists in database OR pending registrations
    if (!isGuest) {
      const emailExists = await UserStore.hasEmail(email)
      
      if (emailExists) {
        return res.status(400).json({ error: 'Email is already registered' })
      }

      // Clean up expired pending registrations first (but not valid ones)
      await PendingRegistrationStore.cleanupExpiredForEmail(email)

      // Now check if there's a valid pending registration AFTER cleaning up expired ones
      // This prevents creating duplicate pending registrations
      if (await PendingRegistrationStore.hasPendingEmail(email)) {
        return res.status(400).json({ error: 'A verification email has already been sent for this email. Please check your inbox.' })
      }

      // No need to clean up orphaned registrations here since we already verified
      // the email doesn't exist in the database, so there can't be any orphaned registrations
    }

    if (!isGuest) {
      const passwordError = validatePassword(password)
      if (passwordError) {
        return res.status(400).json({ error: passwordError })
      }
    }

    // For guest users, save directly (no email verification needed)
    if (isGuest) {
      const passwordHash = await bcrypt.hash(password, 10)
      try {
        await UserStore.addUser(username, null, passwordHash, role, null)
        const token = generateToken({ username, role })
        return res.json({ username, role, token, emailVerified: true })
      } catch (error) {
        if (error.message === 'Username already exists' || error.message === 'Email already registered' || error.message.includes('already exists')) {
          return res.status(400).json({ error: error.message })
        }
        console.error('Registration error:', error)
        res.status(500).json({ error: 'Failed to register user' })
      }
    }

    // For regular users, save to pending registrations (NOT to database yet)
    const passwordHash = await bcrypt.hash(password, 10)
    try {
      const verificationToken = emailService.generateVerificationToken()
      
      // Save to pending registrations, NOT to database
      await PendingRegistrationStore.addPendingRegistration(username, email, passwordHash, role, verificationToken)
      
      const emailResult = await emailService.sendVerificationEmail(email, username, verificationToken)
      
      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error)
        if (emailResult.previewUrl) {
          console.log('Note: Using test email service. Preview URL:', emailResult.previewUrl)
        }
      }

      const responseMessage = emailResult.success 
        ? 'Registration successful!<br>Please check your email to verify your account.'
        : 'Registration successful! However, the verification email could not be sent. Please use the "Resend Verification Email" button.';
      
      res.json({ 
        message: responseMessage,
        emailSent: emailResult.success,
        emailPreviewUrl: null, // Don't expose preview URL to users
        username,
        email
      })
    } catch (error) {
      console.error('Registration error:', error)
      res.status(500).json({ error: 'Failed to process registration. Please try again.' })
    }
  })

  return router
}

module.exports = createRegisterRoutes
