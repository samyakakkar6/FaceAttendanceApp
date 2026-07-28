const logger = require('../utils/logger');

/**
 * Structured application error. Services throw this; the central handler serialises it.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, extra = {}) {
    super(message);
    this.statusCode = statusCode;
    this.extra = extra;
    this.isOperational = true;
  }
}

/**
 * Central Express error handler. Must be the last middleware registered.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message, ...err.extra });
  }

  // Unexpected error — log and hide details from client
  logger.error(err);
  res.status(500).json({ error: 'An unexpected error occurred' });
}

module.exports = { AppError, errorHandler };
