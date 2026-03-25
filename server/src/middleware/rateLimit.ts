import rateLimit from 'express-rate-limit'

const json429 = (_req: unknown, res: { status: (n: number) => { json: (o: unknown) => void } }) =>
  res.status(429).json({ error: 'Too many requests. Please try again later.' })

/** Aggressive limit for auth endpoints — 10 attempts per 15 min per IP */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
})

/** Submission spam protection — 5 per hour per IP */
export const submissionRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
})

/** General API limit — 300 requests per 15 min per IP */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
})
