const express = require('express')
const bcrypt = require('bcryptjs')
const UserStore = require('./UserStore')
const { generateToken } = require('./authUtils')
const { requireAuth } = require('./authMiddleware')
const emailService = require('./emailService')

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
  const { username, email, password, role: requestedRole } = req.body || {}
  const role = allowedRegistrationRoles.includes((requestedRole || '').toLowerCase())
    ? requestedRole.toLowerCase()
    : 'player'

  // Guest accounts don't need email
  const isGuest = role === 'guest'

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' })
  }

  if (!isGuest && !email) {
    return res.status(400).json({ error: 'Email is required for registration' })
  }

  // Validate email format (only for non-guest accounts)
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

  // Validate password requirements (only for non-guest accounts)
  if (!isGuest) {
    const passwordError = validatePassword(password)
    if (passwordError) {
      return res.status(400).json({ error: passwordError })
    }
  }

  const passwordHash = await bcrypt.hash(password, 10)
  try {
    // For guest accounts: no email needed, skip verification
    const verificationToken = isGuest ? null : emailService.generateVerificationToken()
    
    // Create user - guests are automatically verified (no email)
    await UserStore.addUser(username, isGuest ? null : email, passwordHash, role, verificationToken)
    
    // For guest accounts, return token immediately
    if (isGuest) {
      // Generate token and return immediately for guests
      const token = generateToken({ username, role })
      return res.json({ username, role, token, emailVerified: true })
    }
    
    // For regular accounts, send verification email
    const emailResult = await emailService.sendVerificationEmail(email, username, verificationToken)
    
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error)
      if (emailResult.previewUrl) {
        console.log('Note: Using test email service. Preview URL:', emailResult.previewUrl)
      }
    }

    // Don't return token - user needs to verify email first
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

  // Check if email is verified
  if (!user.emailVerified) {
    return res.status(403).json({ 
      error: 'Email not verified',
      emailVerified: false,
      email: user.email,
      message: 'Please verify your email before logging in. Check your inbox for the verification link.'
    })
  }

  const token = generateToken({ username: user.username, role: user.role })
  res.json({ username: user.username, role: user.role, token, emailVerified: true })
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

// Email verification endpoint
authRouter.get('/verify-email', async (req, res) => {
  const { token } = req.query

  if (!token) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verification Failed</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #7c3aed, #4c1d95); color: white; }
          .container { background: white; color: #333; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; }
          .error { color: #e74c3c; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="error">❌ Verification Failed</h1>
          <p>Invalid verification link. Please check your email and try again.</p>
          <a href="/" style="color: #7c3aed;">Go to Home</a>
        </div>
      </body>
      </html>
    `)
  }

  const result = await UserStore.verifyEmail(token)

  if (result.success) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verified</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #7c3aed, #4c1d95); color: white; }
          .container { background: white; color: #333; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; }
          .success { color: #27ae60; }
          .button { display: inline-block; padding: 12px 30px; background: #7c3aed; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="success">✅ Email Verified!</h1>
          <p>Your email has been successfully verified. You can now log in to your account.</p>
          <a href="/" class="button">Go to Login</a>
        </div>
      </body>
      </html>
    `)
  } else {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verification Failed</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #7c3aed, #4c1d95); color: white; }
          .container { background: white; color: #333; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; }
          .error { color: #e74c3c; }
          .button { display: inline-block; padding: 12px 30px; background: #7c3aed; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="error">❌ Verification Failed</h1>
          <p>${result.error || 'Invalid or expired verification link.'}</p>
          <p>Please request a new verification email from the login page.</p>
          <a href="/" class="button">Go to Home</a>
        </div>
      </body>
      </html>
    `)
  }
})

// Resend verification email endpoint
authRouter.post('/resend-verification', async (req, res) => {
  const { username, email } = req.body || {}

  if (!username && !email) {
    return res.status(400).json({ error: 'Username or email is required' })
  }

  let user
  if (email) {
    user = await UserStore.getUserByEmail(email)
  } else {
    user = await UserStore.getUser(username)
  }

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  if (user.emailVerified) {
    return res.status(400).json({ error: 'Email is already verified' })
  }

  // Generate new verification token
  const verificationToken = emailService.generateVerificationToken()
  await UserStore.updateVerificationToken(user.username, verificationToken)

  // Send verification email
  const emailResult = await emailService.sendResendVerificationEmail(user.email, user.username, verificationToken)

  if (emailResult.success) {
    res.json({ message: 'Verification email sent successfully. Please check your inbox.' })
  } else {
    res.status(500).json({ error: 'Failed to send verification email. Please try again later.' })
  }
})

module.exports = authRouter

