const Joi = require('joi');

// Reject weak passwords: require 8+ chars with at least one letter and one
// number, and block a small set of very common/basic passwords.
const COMMON_PASSWORDS = [
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890',
  'qwerty123', 'abc12345', 'admin123', 'iloveyou', 'letmein1', '11111111', 'welcome1',
];
const strongPassword = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  .invalid(...COMMON_PASSWORDS)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.base': 'Password must include at least one letter and one number',
    'any.invalid': 'That password is too common — choose a stronger one',
  });

const register = Joi.object({
  name:     Joi.string().trim().min(2).max(100).required(),
  email:    Joi.string().email().lowercase().required(),
  phone:    Joi.string().pattern(/^\d{10}$/).required().messages({ 'string.pattern.base': 'Phone must be 10 digits' }),
  password: strongPassword,
});

const login = Joi.object({
  email:    Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

const verifyOtp = Joi.object({
  userId: Joi.string().uuid().required(),
  otp:    Joi.string().length(6).pattern(/^\d+$/).required(),
});

const resendOtp = Joi.object({
  userId: Joi.string().uuid().required(),
});

const forgotPassword = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

const resetPassword = Joi.object({
  email:    Joi.string().email().lowercase().required(),
  otp:      Joi.string().length(6).pattern(/^\d+$/).required(),
  password: strongPassword,
});

module.exports = { register, login, verifyOtp, resendOtp, forgotPassword, resetPassword };
