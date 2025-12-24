const UserStore = require('../UserStore')
const PendingRegistrationStore = require('../PendingRegistrationStore')
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
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { height: 100%; overflow: hidden; }
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
              text-align: center; 
              background-color: #1a1a2e; 
              color: white; 
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .container { 
              background: white; 
              color: #333; 
              padding: 40px 30px; 
              border-radius: 20px; 
              max-width: 500px; 
              width: 90%;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            .error { color: #111827; font-size: 1.75rem; font-weight: 700; margin-bottom: 15px; }
            .error-emoji { font-size: 3rem; display: block; margin-bottom: 10px; }
            p { color: #111827; font-size: 1rem; line-height: 1.6; margin-bottom: 20px; }
            a { color: #7c3aed; text-decoration: none; font-weight: 600; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <span class="error-emoji">❌</span>
            <h1 class="error">Verification Failed</h1>
            <p>Invalid verification link. Please check your email and try again.</p>
            <a href="/">Go to Login</a>
          </div>
        </body>
        </html>
      `)
    }

    // First, check if this is a pending registration (new flow)
    const pendingRegistration = await PendingRegistrationStore.getPendingByToken(token)
    
    if (pendingRegistration) {
      // This is a new registration - create the user in database
      try {
        // Check if username or email already exists (in case of race condition)
        if (await UserStore.hasUser(pendingRegistration.username)) {
          await PendingRegistrationStore.deletePendingRegistration(token)
          return res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Email Verification Failed</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html, body { height: 100%; overflow: hidden; }
                body { 
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
                  text-align: center; 
                  background-color: #1a1a2e; 
                  color: white; 
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                }
                .container { 
                  background: white; 
                  color: #333; 
                  padding: 40px 30px; 
                  border-radius: 20px; 
                  max-width: 500px; 
                  width: 90%;
                  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                }
                .error { color: #111827; font-size: 1.75rem; font-weight: 700; margin-bottom: 15px; }
                .error-emoji { font-size: 3rem; display: block; margin-bottom: 10px; }
                p { color: #111827; font-size: 1rem; line-height: 1.6; margin-bottom: 20px; }
                .button { 
                  display: inline-block; 
                  padding: 0.75rem 1.5rem; 
                  background: linear-gradient(135deg, #7c3aed, #4c1d95); 
                  color: white !important; 
                  text-decoration: none; 
                  border-radius: 8px; 
                  margin-top: 10px;
                  font-weight: 700;
                  font-size: 1rem;
                  transition: transform 0.3s ease, box-shadow 0.3s ease;
                  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
                }
                .button:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5);
                }
              </style>
            </head>
            <body>
              <div class="container">
                <span class="error-emoji">❌</span>
                <h1 class="error">Verification Failed</h1>
                <p>Username is already registered. Please contact support if you believe this is an error.</p>
                <a href="/" class="button">Go to Login</a>
              </div>
            </body>
            </html>
          `)
        }

        if (await UserStore.hasEmail(pendingRegistration.email)) {
          await PendingRegistrationStore.deletePendingRegistration(token)
          return res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Email Verification Failed</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html, body { height: 100%; overflow: hidden; }
                body { 
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
                  text-align: center; 
                  background-color: #1a1a2e; 
                  color: white; 
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                }
                .container { 
                  background: white; 
                  color: #333; 
                  padding: 40px 30px; 
                  border-radius: 20px; 
                  max-width: 500px; 
                  width: 90%;
                  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                }
                .error { color: #e74c3c; font-size: 1.75rem; font-weight: 700; margin-bottom: 15px; }
                .error-emoji { font-size: 2rem; display: block; margin-bottom: 10px; }
                p { color: #111827; font-size: 1rem; line-height: 1.6; margin-bottom: 20px; }
                .button { 
                  display: inline-block; 
                  padding: 0.75rem 1.5rem; 
                  background: linear-gradient(135deg, #7c3aed, #4c1d95); 
                  color: white !important; 
                  text-decoration: none; 
                  border-radius: 8px; 
                  margin-top: 10px;
                  font-weight: 700;
                  font-size: 1rem;
                  transition: transform 0.3s ease, box-shadow 0.3s ease;
                  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
                }
                .button:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5);
                }
              </style>
            </head>
            <body>
              <div class="container">
                <span class="error-emoji">❌</span>
                <h1 class="error">Verification Failed</h1>
                <p>Email is already registered. Please contact support if you believe this is an error.</p>
                <a href="/" class="button">Go to Login</a>
              </div>
            </body>
            </html>
          `)
        }

        // Create user in database with emailVerified = true
        await UserStore.addUser(
          pendingRegistration.username,
          pendingRegistration.email,
          pendingRegistration.passwordHash,
          pendingRegistration.role,
          null, // No verification token needed, already verified
          true  // emailVerified = true
        )

        // Delete pending registration
        await PendingRegistrationStore.deletePendingRegistration(token)

        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Email Verified</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body { height: 100%; overflow: hidden; }
              body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
                text-align: center; 
                background-color: #1a1a2e; 
                color: white; 
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
              }
              .container { 
                background: white; 
                color: #333; 
                padding: 40px 30px; 
                border-radius: 20px; 
                max-width: 500px; 
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              }
              .success-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 60px;
                height: 60px;
                background: #d1fae5;
                border-radius: 12px;
                margin-bottom: 20px;
              }
              .success-icon svg {
                width: 36px;
                height: 36px;
                color: #10b981;
              }
              h1 { 
                color: #111827; 
                font-size: 1.75rem;
                font-weight: 700;
                margin: 0 0 15px 0;
              }
              p { 
                color: #111827;
                font-size: 1rem;
                line-height: 1.6;
                margin: 0 0 25px 0;
              }
              .button { 
                display: inline-block; 
                padding: 0.75rem 1.5rem; 
                background: linear-gradient(135deg, #7c3aed, #4c1d95); 
                color: white !important; 
                text-decoration: none; 
                border-radius: 8px; 
                margin-top: 10px;
                font-weight: 700;
                font-size: 1rem;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
              }
              .button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h1>Email Verified!</h1>
              <p>Your email has been successfully verified and your account has been created. You can now log in to your account.</p>
              <a href="/" class="button">Go to Login</a>
            </div>
          </body>
          </html>
        `)
      } catch (error) {
        console.error('Failed to create user after verification:', error)
        return res.status(500).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Email Verification Failed</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body { height: 100%; overflow: hidden; }
              body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
                text-align: center; 
                background-color: #1a1a2e; 
                color: white; 
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
              }
              .container { 
                background: white; 
                color: #333; 
                padding: 40px 30px; 
                border-radius: 20px; 
                max-width: 500px; 
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              }
              .error { color: #111827; font-size: 1.75rem; font-weight: 700; margin-bottom: 15px; }
              .error-emoji { font-size: 3rem; display: block; margin-bottom: 10px; }
              p { color: #111827; font-size: 1rem; line-height: 1.6; margin-bottom: 20px; }
              .button { 
                display: inline-block; 
                padding: 0.75rem 1.5rem; 
                background: linear-gradient(135deg, #7c3aed, #4c1d95); 
                color: white !important; 
                text-decoration: none; 
                border-radius: 8px; 
                margin-top: 10px;
                font-weight: 700;
                font-size: 1rem;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
              }
              .button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <span class="error-emoji">❌</span>
              <h1 class="error">Verification Failed</h1>
              <p>Failed to create your account. Please try registering again.</p>
              <a href="/" class="button">Go to Login</a>
            </div>
          </body>
          </html>
        `)
      }
    }

    // Fallback: Check if this is an old-style verification (for existing users)
    const result = await UserStore.verifyEmail(token)

    if (result.success) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Verified</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { height: 100%; overflow: hidden; }
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
              text-align: center; 
              background-color: #1a1a2e; 
              color: white; 
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .container { 
              background: white; 
              color: #333; 
              padding: 40px 30px; 
              border-radius: 20px; 
              max-width: 500px; 
              width: 90%;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            .success-icon {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 60px;
              height: 60px;
              background: #d1fae5;
              border-radius: 12px;
              margin-bottom: 20px;
            }
            .success-icon svg {
              width: 36px;
              height: 36px;
              color: #10b981;
            }
            h1 { 
              color: #111827; 
              font-size: 1.75rem;
              font-weight: 700;
              margin: 0 0 15px 0;
            }
            p { 
              color: #111827;
              font-size: 1rem;
              line-height: 1.6;
              margin: 0 0 25px 0;
            }
            .button { 
              display: inline-block; 
              padding: 0.75rem 1.5rem; 
              background: linear-gradient(135deg, #7c3aed, #4c1d95); 
              color: white !important; 
              text-decoration: none; 
              border-radius: 8px; 
              margin-top: 10px;
              font-weight: 700;
              font-size: 1rem;
              transition: transform 0.3s ease, box-shadow 0.3s ease;
              box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1>Email Verified!</h1>
            <p>Your email has been successfully verified.</p>
            <p>You can now log in to your account.</p>
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
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { height: 100%; overflow: hidden; }
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
              text-align: center; 
              background-color: #1a1a2e; 
              color: white; 
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .container { 
              background: white; 
              color: #333; 
              padding: 40px 30px; 
              border-radius: 20px; 
              max-width: 500px; 
              width: 90%;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            .error { color: #111827; font-size: 1.75rem; font-weight: 700; margin-bottom: 15px; }
            .error-emoji { font-size: 3rem; display: block; margin-bottom: 10px; }
            p { color: #111827; font-size: 1rem; line-height: 1.6; margin-bottom: 20px; }
            .button { 
              display: inline-block; 
              padding: 0.75rem 1.5rem; 
              background: linear-gradient(135deg, #7c3aed, #4c1d95); 
              color: white !important; 
              text-decoration: none; 
              border-radius: 8px; 
              margin-top: 10px;
              font-weight: 700;
              font-size: 1rem;
              transition: transform 0.3s ease, box-shadow 0.3s ease;
              box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <span class="error-emoji">❌</span>
            <h1 class="error">Verification Failed</h1>
            <p>${result.error || 'Invalid or expired verification link.'} Please request a new verification email from the login page.</p>
            <a href="/" class="button">Go to Login</a>
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

    // First check pending registrations
    let pendingRegistration = null
    if (email) {
      pendingRegistration = await PendingRegistrationStore.getPendingByEmail(email)
    } else if (username) {
      pendingRegistration = await PendingRegistrationStore.getPendingByUsername(username)
    }

    if (pendingRegistration) {
      // Resend email for pending registration
      const newToken = emailService.generateVerificationToken()
      await PendingRegistrationStore.updatePendingToken(pendingRegistration.verificationToken, newToken)

      const emailResult = await emailService.sendVerificationEmail(
        pendingRegistration.email,
        pendingRegistration.username,
        newToken
      )

      if (emailResult.success) {
        res.json({ message: 'Verification email sent successfully. Please check your inbox.' })
      } else {
        res.status(500).json({ error: 'Failed to send verification email. Please try again later.' })
      }
      return
    }

    // Fallback: Check existing users (for old registrations)
    let user
    if (email) {
      user = await UserStore.getUserByEmail(email)
    } else {
      user = await UserStore.getUser(username)
    }

    if (!user) {
      return res.status(404).json({ error: 'No pending registration or user found with this email/username' })
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
