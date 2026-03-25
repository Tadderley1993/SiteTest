import { Request, Response, NextFunction } from 'express'
import { AppError } from '../lib/AppError.js'
import { logger } from '../lib/logger.js'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.code ? { code: err.code } : {}),
    })
    return
  }

  // Unhandled / unexpected errors
  logger.error({ err, url: req.url, method: req.method }, 'Unhandled error')
  res.status(500).json({ error: 'Internal server error' })
}

/** Catch async errors without try/catch in every handler */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}
