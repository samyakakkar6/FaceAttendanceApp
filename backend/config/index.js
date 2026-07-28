require('dotenv').config();

const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),

  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-prod',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },

  email: {
    host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT ?? '587', 10),
    user: process.env.EMAIL_USER ?? '',
    pass: process.env.EMAIL_PASS ?? '',
    // Brevo HTTP API (works on hosts that block SMTP, e.g. Render free tier)
    brevoKey: process.env.BREVO_API_KEY ?? '',
    sender: process.env.EMAIL_SENDER ?? process.env.EMAIL_USER ?? '',
    senderName: process.env.EMAIL_SENDER_NAME ?? 'Dekho Mai Aagya!',
  },

  geofence: {
    lat: parseFloat(process.env.OFFICE_LAT ?? '28.6139'),
    lng: parseFloat(process.env.OFFICE_LNG ?? '77.2090'),
    radius: parseFloat(process.env.OFFICE_RADIUS_METERS ?? '200'),
  },

  admin: {
    email: process.env.ADMIN_EMAIL ?? 'admin@company.com',
    password: process.env.ADMIN_PASSWORD ?? 'Admin@123',
  },

  otp: {
    ttlMs: 10 * 60 * 1000, // 10 minutes
  },

  upload: {
    maxFileBytes: 5 * 1024 * 1024, // 5 MB
  },
};

module.exports = config;
