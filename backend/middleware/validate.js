const { AppError } = require('./errorHandler');

/**
 * Returns an Express middleware that validates req.body against a Joi schema.
 * On failure, throws a 422 AppError with the first validation message.
 */
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: true, stripUnknown: true });
    if (error) return next(new AppError(error.details[0].message, 422));
    req.body = value; // replace with sanitised/coerced value
    next();
  };
}

module.exports = validate;
