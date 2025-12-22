const UserStore = require('../UserStore')
const emailService = require('../emailService')

function createEmailVerificationRoutes() {
  const router = require('express').Router()

  router.get('/verify-email', async (req, res) => {
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

  router.post('/resend-verification', async (req, res) => {
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

    const verificationToken = emailService.generateVerificationToken()
    await UserStore.updateVerificationToken(user.username, verificationToken)

    const emailResult = await emailService.sendResendVerificationEmail(user.email, user.username, verificationToken)

    if (emailResult.success) {
      res.json({ message: 'Verification email sent successfully. Please check your inbox.' })
    } else {
      res.status(500).json({ error: 'Failed to send verification email. Please try again later.' })
    }
  })

  return router
}

module.exports = createEmailVerificationRoutes
