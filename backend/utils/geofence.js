const config = require('../config');

/**
 * Haversine distance between two lat/lng points, in metres.
 */
function haversineMetres(lat1, lng1, lat2, lng2) {
  const R = 6_371_000;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Check whether (lat, lng) is within the configured office geofence.
 * @returns {{ inside: boolean, distance: number }}
 */
function checkGeofence(lat, lng) {
  const distance = haversineMetres(config.geofence.lat, config.geofence.lng, lat, lng);
  return { inside: distance <= config.geofence.radius, distance: Math.round(distance) };
}

module.exports = { checkGeofence, haversineMetres };
