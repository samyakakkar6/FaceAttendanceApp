const db = require('../db');

const OtpRepository = {
  create({ id, userId, otp, expiresAt }) {
    return db.prepare(
      'INSERT INTO otps (id,user_id,otp,expires_at) VALUES (?,?,?,?)'
    ).run(id, userId, otp, expiresAt);
  },

  findActiveForUser(userId) {
    return db.prepare(
      "SELECT * FROM otps WHERE user_id=? AND used=0 AND expires_at > datetime('now') ORDER BY expires_at DESC LIMIT 1"
    ).get(userId);
  },

  markUsed(id) {
    return db.prepare('UPDATE otps SET used=1 WHERE id=?').run(id);
  },
};

module.exports = OtpRepository;
