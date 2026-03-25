export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }

  static badRequest(msg: string, code?: string) {
    return new AppError(400, msg, code)
  }
  static unauthorized(msg = 'Unauthorized', code?: string) {
    return new AppError(401, msg, code)
  }
  static forbidden(msg = 'Forbidden', code?: string) {
    return new AppError(403, msg, code)
  }
  static notFound(msg: string, code?: string) {
    return new AppError(404, msg, code)
  }
  static internal(msg = 'Internal server error', code?: string) {
    return new AppError(500, msg, code)
  }
}
