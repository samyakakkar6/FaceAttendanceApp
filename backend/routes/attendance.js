const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function geofenceCheck(lat, lng) {
  const oLat = parseFloat(process.env.OFFICE_LAT);
  const oLng = parseFloat(process.env.OFFICE_LNG);
  const radius = parseFloat(process.env.OFFICE_RADIUS_METERS);
  const R = 6371000;
  const dLat = ((lat - oLat) * Math.PI) / 180;
  const dLng = ((lng - oLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((oLat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return { inside: distance <= radius, distance: Math.round(distance) };
}

// POST /api/attendance/punch-in
router.post('/punch-in', authMiddleware, upload.single('photo'), (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).json({ error: 'Location required' });

    const geo = geofenceCheck(parseFloat(lat), parseFloat(lng));
    if (!geo.inside)
      return res.status(403).json({
        error: `You are ${geo.distance}m away from office. Must be within ${process.env.OFFICE_RADIUS_METERS}m.`,
        distance: geo.distance,
      });

    const today = new Date().toISOString().slice(0, 10);
    const existing = db
      .prepare('SELECT * FROM attendance WHERE user_id=? AND date=?')
      .get(req.user.id, today);

    if (existing?.punch_in)
      return res.status(409).json({ error: 'Already punched in today', record: existing });

    const now = new Date().toISOString();
    const id = uuidv4();

    if (existing) {
      db.prepare('UPDATE attendance SET punch_in=?, punch_in_photo=?, lat=?, lng=? WHERE id=?').run(
        now, req.file?.filename ?? null, lat, lng, existing.id
      );
    } else {
      db.prepare(
        'INSERT INTO attendance (id,user_id,date,punch_in,punch_in_photo,lat,lng) VALUES (?,?,?,?,?,?,?)'
      ).run(id, req.user.id, today, now, req.file?.filename ?? null, lat, lng);
    }

    res.json({ message: 'Punched in successfully', time: now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Punch-in failed' });
  }
});

// POST /api/attendance/punch-out
router.post('/punch-out', authMiddleware, upload.single('photo'), (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).json({ error: 'Location required' });

    const geo = geofenceCheck(parseFloat(lat), parseFloat(lng));
    if (!geo.inside)
      return res.status(403).json({
        error: `You are ${geo.distance}m away from office.`,
        distance: geo.distance,
      });

    const today = new Date().toISOString().slice(0, 10);
    const record = db
      .prepare('SELECT * FROM attendance WHERE user_id=? AND date=?')
      .get(req.user.id, today);

    if (!record?.punch_in)
      return res.status(400).json({ error: 'No punch-in record found for today' });
    if (record.punch_out)
      return res.status(409).json({ error: 'Already punched out today' });

    const now = new Date().toISOString();
    const punchIn = new Date(record.punch_in);
    const punchOut = new Date(now);
    const shiftMs = punchOut - punchIn;
    const hours = Math.floor(shiftMs / 3600000);
    const minutes = Math.floor((shiftMs % 3600000) / 60000);

    db.prepare('UPDATE attendance SET punch_out=?, punch_out_photo=? WHERE id=?').run(
      now, req.file?.filename ?? null, record.id
    );

    res.json({
      message: 'Punched out successfully',
      time: now,
      shift: `${hours}h ${minutes}m`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Punch-out failed' });
  }
});

// GET /api/attendance/my – current user's records
router.get('/my', authMiddleware, (req, res) => {
  const records = db
    .prepare('SELECT * FROM attendance WHERE user_id=? ORDER BY date DESC LIMIT 30')
    .all(req.user.id);
  res.json(records);
});

// GET /api/attendance/today – today's status for current user
router.get('/today', authMiddleware, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const record = db
    .prepare('SELECT * FROM attendance WHERE user_id=? AND date=?')
    .get(req.user.id, today);
  res.json(record ?? { date: today, punch_in: null, punch_out: null });
});

module.exports = router;
