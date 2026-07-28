const express = require('express');
const validate = require('../../middleware/validate');
const schemas = require('../../validators/auth.validators');
const AuthService = require('../../services/auth.service');

const router = express.Router();

router.post('/register', validate(schemas.register), async (req, res, next) => {
  try {
    const result = await AuthService.register(req.body);
    res.status(201).json({ message: 'Registered. Check your email for OTP.', ...result });
  } catch (err) { next(err); }
});

router.post('/login', validate(schemas.login), async (req, res, next) => {
  try {
    const result = await AuthService.login(req.body);
    res.json({ message: 'Logged in.', ...result });
  } catch (err) { next(err); }
});

router.post('/verify-otp', validate(schemas.verifyOtp), (req, res, next) => {
  try {
    const result = AuthService.verifyOtp(req.body);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/resend-otp', validate(schemas.resendOtp), async (req, res, next) => {
  try {
    const result = await AuthService.resendOtp(req.body.userId);
    res.json({ message: 'OTP resent.', ...result });
  } catch (err) { next(err); }
});

router.post('/forgot-password', validate(schemas.forgotPassword), async (req, res, next) => {
  try {
    const result = await AuthService.forgotPassword(req.body);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/reset-password', validate(schemas.resetPassword), async (req, res, next) => {
  try {
    const result = await AuthService.resetPassword(req.body);
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
