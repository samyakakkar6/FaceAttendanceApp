const express = require('express');
const path = require('path');
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/employees
router.get('/employees', authMiddleware, adminOnly, (req, res) => {
  const employees = db
    .prepare('SELECT id,name,email,phone,role,is_verified,face_photo,created_at FROM users WHERE role=?')
    .all('employee');
  res.json(employees);
});

// GET /api/admin/attendance?date=YYYY-MM-DD
router.get('/attendance', authMiddleware, adminOnly, (req, res) => {
  const { date, userId } = req.query;
  let query = `
    SELECT a.*, u.name, u.email, u.phone
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (date) { query += ' AND a.date=?'; params.push(date); }
  if (userId) { query += ' AND a.user_id=?'; params.push(userId); }
  query += ' ORDER BY a.date DESC, a.punch_in DESC LIMIT 200';
  res.json(db.prepare(query).all(...params));
});

// GET /api/admin/attendance/:id – single record with shift details
router.get('/attendance/:id', authMiddleware, adminOnly, (req, res) => {
  const record = db.prepare(`
    SELECT a.*, u.name, u.email, u.phone
    FROM attendance a JOIN users u ON a.user_id=u.id
    WHERE a.id=?
  `).get(req.params.id);
  if (!record) return res.status(404).json({ error: 'Record not found' });

  let shift = null;
  if (record.punch_in && record.punch_out) {
    const ms = new Date(record.punch_out) - new Date(record.punch_in);
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    shift = `${h}h ${m}m`;
  }
  res.json({ ...record, shift });
});

// GET /api/admin/photo/:filename
router.get('/photo/:filename', authMiddleware, adminOnly, (req, res) => {
  const file = path.join(__dirname, '../uploads', req.params.filename);
  res.sendFile(file, err => {
    if (err) res.status(404).json({ error: 'Photo not found' });
  });
});

// GET /api/admin/stats?date=YYYY-MM-DD
router.get('/stats', authMiddleware, adminOnly, (req, res) => {
  const date = req.query.date ?? new Date().toISOString().slice(0, 10);
  const total = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='employee' AND is_verified=1").get().c;
  const present = db.prepare("SELECT COUNT(*) as c FROM attendance WHERE date=? AND punch_in IS NOT NULL").get(date).c;
  const punchedOut = db.prepare("SELECT COUNT(*) as c FROM attendance WHERE date=? AND punch_out IS NOT NULL").get(date).c;
  res.json({ date, total, present, absent: total - present, punchedOut });
});

// GET /api/admin/geofence – get current geofence config
router.get('/geofence', authMiddleware, adminOnly, (req, res) => {
  res.json({
    lat: parseFloat(process.env.OFFICE_LAT),
    lng: parseFloat(process.env.OFFICE_LNG),
    radius: parseFloat(process.env.OFFICE_RADIUS_METERS),
  });
});

module.exports = router;
