const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpEmail(email, otp) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  await transporter.sendMail({
    from: `"Face Attendance" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP Code',
    html: `<h2>Your OTP is: <strong>${otp}</strong></h2><p>Valid for 10 minutes.</p>`,
  });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password)
      return res.status(400).json({ error: 'All fields required' });

    const existing = db.prepare('SELECT id FROM users WHERE email=? OR phone=?').get(email, phone);
    if (existing) return res.status(409).json({ error: 'Email or phone already registered' });

    const hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    db.prepare(
      'INSERT INTO users (id,name,email,phone,password) VALUES (?,?,?,?,?)'
    ).run(id, name, email, phone, hash);

    const otp = makeOtp();
    const otpId = uuidv4();
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO otps (id,user_id,otp,expires_at) VALUES (?,?,?,?)').run(otpId, id, otp, expires);

    if (process.env.NODE_ENV === 'production') {
      await sendOtpEmail(email, otp);
    } else {
      console.log(`[DEV] OTP for ${email}: ${otp}`);
    }

    res.json({ message: 'Registered. Check email for OTP.', userId: id, ...(process.env.NODE_ENV !== 'production' && { otp }) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', (req, res) => {
  const { userId, otp } = req.body;
  const record = db.prepare(
    "SELECT * FROM otps WHERE user_id=? AND used=0 AND expires_at > datetime('now') ORDER BY expires_at DESC LIMIT 1"
  ).get(userId);

  if (!record || record.otp !== otp)
    return res.status(400).json({ error: 'Invalid or expired OTP' });

  db.prepare('UPDATE otps SET used=1 WHERE id=?').run(record.id);
  db.prepare('UPDATE users SET is_verified=1 WHERE id=?').run(userId);

  const user = db.prepare('SELECT id,name,email,role,face_descriptor FROM users WHERE id=?').get(userId);
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  res.json({ token, user });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.is_verified) return res.status(403).json({ error: 'Account not verified', userId: user.id });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Send OTP for 2FA
    const otp = makeOtp();
    const otpId = uuidv4();
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO otps (id,user_id,otp,expires_at) VALUES (?,?,?,?)').run(otpId, user.id, otp, expires);

    if (process.env.NODE_ENV === 'production') {
      await sendOtpEmail(email, otp);
    } else {
      console.log(`[DEV] OTP for ${email}: ${otp}`);
    }

    res.json({ message: 'OTP sent', userId: user.id, ...(process.env.NODE_ENV !== 'production' && { otp }) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const otp = makeOtp();
    const otpId = uuidv4();
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO otps (id,user_id,otp,expires_at) VALUES (?,?,?,?)').run(otpId, userId, otp, expires);

    if (process.env.NODE_ENV === 'production') {
      await sendOtpEmail(user.email, otp);
    } else {
      console.log(`[DEV] OTP for ${user.email}: ${otp}`);
    }

    res.json({ message: 'OTP resent', ...(process.env.NODE_ENV !== 'production' && { otp }) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

module.exports = router;
