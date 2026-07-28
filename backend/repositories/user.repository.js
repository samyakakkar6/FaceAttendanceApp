const db = require('../db');

const UserRepository = {
  findById(id) {
    return db.prepare('SELECT * FROM users WHERE id=?').get(id);
  },

  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email=?').get(email);
  },

  findByEmailOrPhone(email, phone) {
    return db.prepare('SELECT id FROM users WHERE email=? OR phone=?').get(email, phone);
  },

  create({ id, name, email, phone, password, role = 'employee' }) {
    return db.prepare(
      'INSERT INTO users (id,name,email,phone,password,role) VALUES (?,?,?,?,?,?)'
    ).run(id, name, email, phone, password, role);
  },

  markVerified(id) {
    return db.prepare('UPDATE users SET is_verified=1 WHERE id=?').run(id);
  },

  updatePassword(id, passwordHash) {
    return db.prepare('UPDATE users SET password=? WHERE id=?').run(passwordHash, id);
  },

  findByPhone(phone) {
    return db.prepare('SELECT * FROM users WHERE phone=?').get(phone);
  },

  setCredentials(id, email, passwordHash) {
    return db.prepare('UPDATE users SET email=?, password=? WHERE id=?').run(email, passwordHash, id);
  },

  deleteById(id) {
    db.prepare('DELETE FROM attendance WHERE user_id=?').run(id);
    db.prepare('DELETE FROM otps WHERE user_id=?').run(id);
    return db.prepare("DELETE FROM users WHERE id=? AND role='employee'").run(id);
  },

  saveFaceDescriptor(id, descriptor, photoFilename) {
    return db.prepare('UPDATE users SET face_descriptor=?, face_photo=? WHERE id=?').run(descriptor, photoFilename, id);
  },

  publicFields(id) {
    return db.prepare('SELECT id,name,email,role,face_descriptor,face_photo FROM users WHERE id=?').get(id);
  },

  allEmployees() {
    return db
      .prepare('SELECT id,name,email,phone,role,is_verified,face_photo,created_at FROM users WHERE role=?')
      .all('employee');
  },

  createAdmin({ id, name, email, phone, password }) {
    return db.prepare(
      'INSERT INTO users (id,name,email,phone,password,role,is_verified) VALUES (?,?,?,?,?,?,1)'
    ).run(id, name, email, phone, password, 'admin');
  },
};

module.exports = UserRepository;
