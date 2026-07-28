const db = require('../db');
const config = require('../config');
const UserRepository = require('../repositories/user.repository');
const AttendanceRepository = require('../repositories/attendance.repository');

function getStats(date) {
  const total = db.prepare(
    "SELECT COUNT(*) as c FROM users WHERE role='employee' AND is_verified=1"
  ).get().c;
  const present    = AttendanceRepository.countPresent(date);
  const punchedOut = AttendanceRepository.countPunchedOut(date);
  return { date, total, present, absent: total - present, punchedOut };
}

function getAttendance({ date, userId } = {}) {
  return AttendanceRepository.findAll({ date, userId });
}

function getAttendanceRecord(id) {
  const record = AttendanceRepository.findByIdWithUser(id);
  if (!record) return null;

  let shift = null;
  let completed = false;
  if (record.punch_in && record.punch_out) {
    const ms = new Date(record.punch_out) - new Date(record.punch_in);
    // A shift under 1 minute is treated as not completed (likely a mis-punch).
    completed = ms >= 60_000;
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1_000);
    shift = `${h}h ${m}m ${s}s`;
  }
  return { ...record, shift, completed };
}

function getEmployees() {
  return UserRepository.allEmployees();
}

function getGeofenceConfig() {
  return { lat: config.geofence.lat, lng: config.geofence.lng, radius: config.geofence.radius };
}

function deleteEmployee(id) {
  const result = UserRepository.deleteById(id);
  return { deleted: result.changes > 0 };
}

module.exports = { getStats, getAttendance, getAttendanceRecord, getEmployees, getGeofenceConfig, deleteEmployee };
