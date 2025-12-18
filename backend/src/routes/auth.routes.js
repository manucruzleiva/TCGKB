import express from 'express'
import { register, login, getMe, refreshToken, updatePreferences, updateAccount, updateAvatar } from '../controllers/auth.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { authLimiter, generalLimiter } from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)
router.get('/me', protect, getMe)
router.post('/refresh', protect, refreshToken)
router.put('/preferences', protect, generalLimiter, updatePreferences)
router.put('/avatar', protect, generalLimiter, updateAvatar)
router.put('/update-account', protect, generalLimiter, updateAccount)

export default router
