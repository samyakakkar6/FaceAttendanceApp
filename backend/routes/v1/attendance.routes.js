const express = require('express');
const { authMiddleware } = require('../../middleware/auth');
const upload = require('../../utils/upload');
const validate = require('../../middleware/validate');
const schemas = require('../../validators/attendance.validators');
const AttendanceService = require('../../services/attendance.service');

const router = express.Router();

router.post('/punch-in', authMiddleware, upload.single('photo'), validate(schemas.punch), (req, res, next) => {
  try {
    const result = AttendanceService.punchIn(req.user.id, {
      lat: req.body.lat,
      lng: req.body.lng,
      photoFilename: req.file?.filename,
    });
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/punch-out', authMiddleware, upload.single('photo'), validate(schemas.punch), (req, res, next) => {
  try {
    const result = AttendanceService.punchOut(req.user.id, {
      lat: req.body.lat,
      lng: req.body.lng,
      photoFilename: req.file?.filename,
    });
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/today', authMiddleware, (req, res, next) => {
  try {
    res.json(AttendanceService.getToday(req.user.id));
  } catch (err) { next(err); }
});

router.get('/my', authMiddleware, (req, res, next) => {
  try {
    res.json(AttendanceService.getMyHistory(req.user.id));
  } catch (err) { next(err); }
});

module.exports = router;
