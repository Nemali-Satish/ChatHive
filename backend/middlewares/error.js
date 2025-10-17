export const errorMiddleware = (err, _req, res, _next) => {
    const status = err.status || 500
    const message = err.message || 'Internal Server Error'
    const details = process.env.NODE_ENV === 'development' ? err.stack : undefined
    res.status(status).json({ ok: false, message, details })
}
