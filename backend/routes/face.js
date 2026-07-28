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

// POST /api/face/register – save face descriptor + photo
router.post('/register', authMiddleware, upload.single('photo'), (req, res) => {
  const { descriptor } = req.body;
  if (!descriptor || !req.file)
    return res.status(400).json({ error: 'Descriptor and photo required' });

  db.prepare('UPDATE users SET face_descriptor=?, face_photo=? WHERE id=?').run(
    descriptor,
    req.file.filename,
    req.user.id
  );
  res.json({ message: 'Face registered successfully' });
});

// POST /api/face/verify – compare descriptor, return match score
router.post('/verify', authMiddleware, (req, res) => {
  const { descriptor } = req.body;
  if (!descriptor) return res.status(400).json({ error: 'Descriptor required' });

  const user = db.prepare('SELECT face_descriptor FROM users WHERE id=?').get(req.user.id);
  if (!user?.face_descriptor)
    return res.status(404).json({ error: 'No face registered for this user', registered: false });

  // Euclidean distance computed on client; backend just confirms stored descriptor exists
  res.json({ registered: true, storedDescriptor: user.face_descriptor });
});

module.exports = router;
