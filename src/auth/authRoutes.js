const express = require('express')
const createLoginRoutes = require('./routes/loginRoutes')
const createRegisterRoutes = require('./routes/registerRoutes')
const createProfileRoutes = require('./routes/profileRoutes')
const createEmailVerificationRoutes = require('./routes/emailVerificationRoutes')

const authRouter = express.Router()

authRouter.use(createLoginRoutes())
authRouter.use(createRegisterRoutes())
authRouter.use(createProfileRoutes())
authRouter.use(createEmailVerificationRoutes())

module.exports = authRouter

