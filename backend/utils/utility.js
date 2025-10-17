export class ErrorHandler extends Error {
  constructor(message, status = 500) {
    super(message)
    this.status = status
  }
}

export const TryCatch = (func) => async (req, res, next) => {
  try {
    await func(req, res, next)
  } catch (error) {
    next(error)
  }
}
