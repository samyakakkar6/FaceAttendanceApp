const db = require('../db');

const AttendanceRepository = {
  findByUserAndDate(userId, date) {
    return db.prepare('SELECT * FROM attendance WHERE user_id=? AND date=?').get(userId, date);
  },

  create({ id, userId, date, punchIn, punchInPhoto, lat, lng }) {
    return db.prepare(
      'INSERT INTO attendance (id,user_id,date,punch_in,punch_in_photo,lat,lng) VALUES (?,?,?,?,?,?,?)'
    ).run(id, userId, date, punchIn, punchInPhoto ?? null, lat, lng);
  },

  setPunchIn(id, punchIn, punchInPhoto, lat, lng) {
    return db.prepare(
      'UPDATE attendance SET punch_in=?, punch_in_photo=?, lat=?, lng=? WHERE id=?'
    ).run(punchIn, punchInPhoto ?? null, lat, lng, id);
  },

  setPunchOut(id, punchOut, punchOutPhoto) {
    return db.prepare(
      'UPDATE attendance SET punch_out=?, punch_out_photo=? WHERE id=?'
    ).run(punchOut, punchOutPhoto ?? null, id);
  },

  findRecentByUser(userId, limit = 30) {
    return db.prepare(
      'SELECT * FROM attendance WHERE user_id=? ORDER BY date DESC LIMIT ?'
    ).all(userId, limit);
  },

  findAll({ date, userId } = {}) {
    let sql = `
      SELECT a.*, u.name, u.email, u.phone
      FROM attendance a JOIN users u ON a.user_id=u.id
      WHERE 1=1
    `;
    const params = [];
    if (date)   { sql += ' AND a.date=?';    params.push(date); }
    if (userId) { sql += ' AND a.user_id=?'; params.push(userId); }
    sql += ' ORDER BY a.date DESC, a.punch_in DESC LIMIT 200';
    return db.prepare(sql).all(...params);
  },

  findByIdWithUser(id) {
    return db.prepare(`
      SELECT a.*, u.name, u.email, u.phone
      FROM attendance a JOIN users u ON a.user_id=u.id
      WHERE a.id=?
    `).get(id);
  },

  countPresent(date) {
    return db.prepare(
      'SELECT COUNT(*) as c FROM attendance WHERE date=? AND punch_in IS NOT NULL'
    ).get(date).c;
  },

  countPunchedOut(date) {
    return db.prepare(
      'SELECT COUNT(*) as c FROM attendance WHERE date=? AND punch_out IS NOT NULL'
    ).get(date).c;
  },
};

module.exports = AttendanceRepository;
