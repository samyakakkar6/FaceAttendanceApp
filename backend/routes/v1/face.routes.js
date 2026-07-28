const express = require('express');
const { authMiddleware } = require('../../middleware/auth');
const upload = require('../../utils/upload');
const FaceService = require('../../services/face.service');

const router = express.Router();

router.post('/register', authMiddleware, upload.single('photo'), (req, res, next) => {
  try {
    const { descriptor } = req.body;
    if (!descriptor || !req.file) {
      return res.status(400).json({ error: 'Descriptor and photo required' });
    }
    FaceService.registerFace(req.user.id, descriptor, req.file.filename);
    res.json({ message: 'Face registered successfully', face_photo: req.file.filename });
  } catch (err) { next(err); }
});

router.post('/verify', authMiddleware, (req, res, next) => {
  try {
    const result = FaceService.getStoredDescriptor(req.user.id);
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
