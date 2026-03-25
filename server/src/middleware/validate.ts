import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

/**
 * Zod validation middleware factory.
 * Usage: router.post('/', validate(MySchema), handler)
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errors = result.error.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      return res.status(400).json({ error: 'Validation failed', errors })
    }
    req.body = result.data
    next()
  }
}

/**
 * Validate query params.
 * Usage: router.get('/', validateQuery(QuerySchema), handler)
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      const errors = result.error.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      return res.status(400).json({ error: 'Invalid query parameters', errors })
    }
    req.query = result.data as typeof req.query
    next()
  }
}
