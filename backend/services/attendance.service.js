const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const AttendanceRepository = require('../repositories/attendance.repository');
const { checkGeofence } = require('../utils/geofence');
const { AppError } = require('../middleware/errorHandler');

function formatShift(punchInIso, punchOutIso) {
  const ms = new Date(punchOutIso) - new Date(punchInIso);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

function assertInsideGeofence(lat, lng) {
  const geo = checkGeofence(lat, lng);
  if (!geo.inside) {
    throw new AppError(
      `You are ${geo.distance}m from the office. Must be within ${config.geofence.radius}m.`,
      403,
      { distance: geo.distance }
    );
  }
}

function punchIn(userId, { lat, lng, photoFilename }) {
  assertInsideGeofence(lat, lng);

  const today = new Date().toISOString().slice(0, 10);
  const existing = AttendanceRepository.findByUserAndDate(userId, today);

  if (existing?.punch_in) {
    throw new AppError('Already punched in today', 409, { record: existing });
  }

  const now = new Date().toISOString();

  if (existing) {
    AttendanceRepository.setPunchIn(existing.id, now, photoFilename, lat, lng);
  } else {
    AttendanceRepository.create({ id: uuidv4(), userId, date: today, punchIn: now, punchInPhoto: photoFilename, lat, lng });
  }

  return { message: 'Punched in successfully', time: now };
}

function punchOut(userId, { lat, lng, photoFilename }) {
  assertInsideGeofence(lat, lng);

  const today = new Date().toISOString().slice(0, 10);
  const record = AttendanceRepository.findByUserAndDate(userId, today);

  if (!record?.punch_in) throw new AppError('No punch-in found for today', 400);
  if (record.punch_out)  throw new AppError('Already punched out today', 409);

  const now = new Date().toISOString();
  AttendanceRepository.setPunchOut(record.id, now, photoFilename);

  return { message: 'Punched out successfully', time: now, shift: formatShift(record.punch_in, now) };
}

function getToday(userId) {
  const today = new Date().toISOString().slice(0, 10);
  return AttendanceRepository.findByUserAndDate(userId, today) ?? { date: today, punch_in: null, punch_out: null };
}

function getMyHistory(userId) {
  return AttendanceRepository.findRecentByUser(userId);
}

module.exports = { punchIn, punchOut, getToday, getMyHistory };
