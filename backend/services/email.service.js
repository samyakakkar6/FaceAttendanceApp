const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');

// Singleton transporter — created once, reused for every email.
let _transporter = null;

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      auth: { user: config.email.user, pass: config.email.pass },
      // Fail fast if SMTP is blocked (e.g. Render free tier) so requests
      // aren't held open waiting for a long OS-level connection timeout.
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });
  }
  return _transporter;
}

// Real email is sent whenever valid SMTP credentials are configured —
// regardless of NODE_ENV. If they're missing/placeholder, the OTP is logged
// to the console so the app stays testable without SMTP.
function emailConfigured() {
  const { user, pass } = config.email;
  return user && pass && !user.includes('your_email') && !pass.includes('your_app_password');
}

function emailHtml(firstName, otp) {
  return `
    <div style="font-family:sans-serif;max-width:440px;margin:auto;border:1px solid #eee;border-radius:14px;overflow:hidden">
      <div style="background:#0C447C;color:#fff;padding:20px 24px">
        <div style="font-size:20px;font-weight:600">Dekho Mai Aagya!</div>
        <div style="font-size:13px;color:#B5D4F4">Attendance verification</div>
      </div>
      <div style="padding:24px">
        <p style="font-size:16px;margin:0 0 6px">Hi <b>${firstName}</b>,</p>
        <p style="color:#444;margin:0 0 18px">Use the verification code below to continue.</p>
        <div style="background:#E6F1FB;border-radius:10px;text-align:center;padding:18px 0;margin-bottom:18px">
          <span style="font-size:2.4rem;letter-spacing:10px;font-weight:bold;color:#0C447C">${otp}</span>
        </div>
        <p style="color:#888;font-size:13px;margin:0">This code expires in 10 minutes. If you did not request it, you can safely ignore this email.</p>
      </div>
      <div style="background:#f7f7f5;color:#999;font-size:11px;text-align:center;padding:12px">Dekho Mai Aagya! · automated message, please do not reply</div>
    </div>
  `;
}

// Brevo HTTP API — sends over HTTPS (port 443), so it works on hosts that
// block SMTP ports (Render free tier). Best path for real inbox delivery.
async function sendViaBrevo(toEmail, otp, firstName, subject) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': config.email.brevoKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: config.email.sender, name: config.email.senderName },
      to: [{ email: toEmail, name: firstName }],
      subject,
      htmlContent: emailHtml(firstName, otp),
    }),
  });
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`);
}

async function sendOtp(toEmail, otp, name) {
  const firstName = (name || 'there').split(' ')[0];
  const subject = 'Your verification code';

  if (config.email.brevoKey && config.email.sender) {
    try {
      await sendViaBrevo(toEmail, otp, firstName, subject);
      logger.info(`OTP email sent (Brevo) to ${toEmail}`);
      return true;
    } catch (err) {
      logger.error(`Brevo send failed for ${toEmail}: ${err.message}`);
      return false;
    }
  }

  if (!emailConfigured()) {
    logger.info(`[DEV] OTP for ${toEmail}: ${otp}`);
    return false;
  }
  try {
    await getTransporter().sendMail({
      from: `"${config.email.senderName}" <${config.email.user}>`,
      to: toEmail, subject, html: emailHtml(firstName, otp),
    });
    logger.info(`OTP email sent (SMTP) to ${toEmail}`);
    return true;
  } catch (err) {
    logger.error(`OTP email failed for ${toEmail}: ${err.message}`);
    return false;
  }
}

module.exports = { sendOtp };
