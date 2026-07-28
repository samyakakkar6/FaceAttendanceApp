const config = require('./config');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const UserRepository = require('./repositories/user.repository');

const app = express();

// Render (and most hosts) put the app behind a proxy — needed for rate-limit + IPs.
app.set('trust proxy', 1);

// ── Core middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// ── Rate limiting ──────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, try again later.' },
});
app.use('/api/v1/auth', authLimiter);

// ── Routes (versioned) ────────────────────────────────────────────────────────
app.use('/api/v1', require('./routes/v1'));

// Static file serving for uploaded photos (admin-only route handles auth)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', version: 'v1', time: new Date().toISOString() }));

// ── Central error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Bootstrap admin account ───────────────────────────────────────────────────
const ADMIN_PHONE = '0000000000';
async function seedAdmin() {
  const hash = await bcrypt.hash(config.admin.password, 10);
  // The DB persists across restarts, so keep the single bootstrap admin in sync
  // with the configured env credentials rather than inserting a duplicate.
  const existing = UserRepository.findByPhone(ADMIN_PHONE);
  if (existing) {
    UserRepository.setCredentials(existing.id, config.admin.email, hash);
    logger.info(`Admin synced: ${config.admin.email}`);
    return;
  }
  if (UserRepository.findByEmail(config.admin.email)) return;
  UserRepository.createAdmin({
    id: uuidv4(),
    name: 'Admin',
    email: config.admin.email,
    phone: ADMIN_PHONE,
    password: hash,
  });
  logger.info(`Admin seeded: ${config.admin.email}`);
}

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(config.port, async () => {
  await seedAdmin();
  logger.info(`Server running on port ${config.port} [${config.env}]`);
});
