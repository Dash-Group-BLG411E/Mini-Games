const bcrypt = require('bcryptjs')
const UserStore = require('../UserStore')
const { generateToken } = require('../authUtils')

function createLoginRoutes() {
  const router = require('express').Router()

  router.post('/login', async (req, res) => {
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

  return router
}

module.exports = createLoginRoutes
