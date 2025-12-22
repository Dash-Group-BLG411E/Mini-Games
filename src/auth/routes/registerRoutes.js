const bcrypt = require('bcryptjs')
const UserStore = require('../UserStore')
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

    if (await UserStore.hasUser(username)) {
      return res.status(400).json({ error: 'Username is already registered' })
    }

    if (!isGuest && await UserStore.hasEmail(email)) {
      return res.status(400).json({ error: 'Email is already registered' })
    }

    if (!isGuest) {
      const passwordError = validatePassword(password)
      if (passwordError) {
        return res.status(400).json({ error: passwordError })
      }
    }

    const passwordHash = await bcrypt.hash(password, 10)
    try {
      const verificationToken = isGuest ? null : emailService.generateVerificationToken()
      
      await UserStore.addUser(username, isGuest ? null : email, passwordHash, role, verificationToken)
      
      if (isGuest) {
        const token = generateToken({ username, role })
        return res.json({ username, role, token, emailVerified: true })
      }
      
      const emailResult = await emailService.sendVerificationEmail(email, username, verificationToken)
      
      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error)
        if (emailResult.previewUrl) {
          console.log('Note: Using test email service. Preview URL:', emailResult.previewUrl)
        }
      }

      const responseMessage = emailResult.success 
        ? 'Registration successful! Please check your email to verify your account.'
        : 'Registration successful! However, the verification email could not be sent. Please use the "Resend Verification Email" button.';
      
      res.json({ 
        message: responseMessage,
        emailSent: emailResult.success,
        emailPreviewUrl: emailResult.previewUrl || null,
        username,
        email
      })
    } catch (error) {
      if (error.message === 'Username already exists' || error.message === 'Email already registered' || error.message.includes('already exists')) {
        return res.status(400).json({ error: error.message })
      }
      console.error('Registration error:', error)
      res.status(500).json({ error: 'Failed to register user' })
    }
  })

  return router
}

module.exports = createRegisterRoutes
