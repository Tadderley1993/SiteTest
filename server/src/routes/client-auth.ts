import { Router } from 'express'
import { z } from 'zod'
import { clientAuthService } from '../services/client-auth.service.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { authRateLimit } from '../middleware/rateLimit.js'

const router = Router()

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post('/login', authRateLimit, asyncHandler(async (req, res) => {
  const { email, password } = LoginSchema.parse(req.body)
  const result = await clientAuthService.login(email, password)
  res.json(result)
}))

export { router as clientAuthRouter }
