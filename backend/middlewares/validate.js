import { validationResult } from 'express-validator'

export const validate = (schemas = []) => {
  return [
    ...schemas,
    (req, res, next) => {
      const result = validationResult(req)
      if (result.isEmpty()) return next()
      const first = result.array({ onlyFirstError: true })[0]
      return res.status(400).json({ ok: false, message: first?.msg || 'Invalid request', errors: result.array() })
    },
  ]
}
