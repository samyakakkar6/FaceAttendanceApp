const express = require('express');
const config = require('../../config');
const router = express.Router();

// Public: office geofence centre + radius, so the client can show an accurate
// inside/outside indicator. The punch endpoints still re-check server-side.
router.get('/geofence', (_req, res) => {
  res.json({ lat: config.geofence.lat, lng: config.geofence.lng, radius: config.geofence.radius });
});

router.use('/auth',       require('./auth.routes'));
router.use('/face',       require('./face.routes'));
router.use('/attendance', require('./attendance.routes'));
router.use('/admin',      require('./admin.routes'));

module.exports = router;
