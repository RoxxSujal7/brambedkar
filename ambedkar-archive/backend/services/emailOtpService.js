/**
 * emailOtpService.js — Real Transactional Email OTP Delivery Service
 * Uses Resend API (https://resend.com) with resilient dev/test fallback.
 */

const { Resend } = require('resend');
const nodemailer = require('nodemailer');

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = process.env.EMAIL_FROM || 'Ambedkar Digital Archive <onboarding@resend.dev>';

/**
 * Configure SMTP / Gmail transporter
 * Supports free Google App Password without domain restrictions
 */
function getSmtpTransporter() {
  const gmailUser = (process.env.GMAIL_USER || '').trim();
  const gmailAppPass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '').trim();

  if (gmailUser && gmailAppPass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  const smtpHost = (process.env.SMTP_HOST || '').trim();
  if (smtpHost) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: (process.env.SMTP_USER || '').trim(),
        pass: (process.env.SMTP_PASS || '').trim(),
      },
    });
  }

  return null;
}

/**
 * Generate museum-grade HTML email template for OTP
 */
function buildOtpEmailHtml(otp, recipientEmail) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code — Ambedkar Digital Heritage Archive</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9; }
    .wrapper { width: 100%; max-width: 580px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #131b2e; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 16px; padding: 36px 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; }
    .logo-badge { display: inline-block; width: 56px; height: 56px; line-height: 56px; font-size: 28px; background: linear-gradient(135deg, #1e3a8a, #312e81); border: 1px solid #d4af37; border-radius: 14px; margin-bottom: 20px; }
    h1 { font-size: 22px; font-weight: 700; color: #f8fafc; margin: 0 0 10px; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px; }
    .otp-box { background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(212, 175, 55, 0.5); border-radius: 12px; padding: 18px 24px; margin: 24px 0; display: inline-block; letter-spacing: 10px; font-family: monospace; font-size: 32px; font-weight: 800; color: #fbbf24; text-shadow: 0 0 12px rgba(251, 191, 36, 0.3); }
    .meta-info { font-size: 13px; color: #64748b; margin-top: 20px; }
    .footer { text-align: center; font-size: 12px; color: #475569; margin-top: 28px; line-height: 1.5; }
    .security-notice { background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 12px; font-size: 12px; color: #fca5a5; margin-top: 24px; text-align: left; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo-badge">🏛️</div>
      <h1>Verification Code</h1>
      <p>Sign in to <strong>Dr. B. R. Ambedkar Digital Heritage Archive</strong>. Use the single-use code below to complete authentication:</p>
      
      <div class="otp-box">${otp}</div>
      
      <p class="meta-info">⏱️ Code valid for <strong>5 minutes</strong>. If you did not request this login code, you can safely ignore this email.</p>
      
      <div class="security-notice">
        🛡️ <strong>Security Tip:</strong> Archive staff will never ask for your verification code. Never share this code with anyone.
      </div>
    </div>
    <div class="footer">
      National Heritage Preservation • MEA &amp; Dr. Ambedkar Foundation<br>
      Dr. B. R. Ambedkar Digital Heritage Archive • All Rights Reserved
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send Email OTP using Resend API or safe development logger
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit numeric OTP code
 * @returns {Promise<{ success: boolean, messageId?: string, isDevMode?: boolean }>}
 */
async function sendEmailOtp(toEmail, otp) {
  const cleanEmail = (toEmail || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Invalid email address provided for OTP dispatch.');
  }

  const provider = (process.env.EMAIL_PROVIDER || (process.env.GMAIL_USER ? 'gmail' : (process.env.RESEND_API_KEY ? 'resend' : 'dev'))).toLowerCase().trim();

  // 1. Gmail SMTP Provider Branch
  if (provider === 'gmail') {
    const smtpTransport = getSmtpTransporter();
    if (!smtpTransport) {
      throw new Error('Gmail SMTP provider selected but credentials (GMAIL_USER/GMAIL_APP_PASSWORD) are missing.');
    }

    try {
      const gmailSender = process.env.GMAIL_USER ? `Ambedkar Digital Archive <${process.env.GMAIL_USER}>` : fromEmail;
      const info = await smtpTransport.sendMail({
        from: process.env.EMAIL_FROM || gmailSender,
        to: cleanEmail,
        subject: `${otp} is your Ambedkar Digital Archive verification code`,
        html: buildOtpEmailHtml(otp, cleanEmail),
        text: `Your Dr. B. R. Ambedkar Digital Heritage Archive verification code is: ${otp}\n\nValid for 5 minutes. Never share this code with anyone.`,
      });

      return {
        success: true,
        messageId: info.messageId || 'smtp-' + Date.now(),
        provider: 'gmail_smtp',
      };
    } catch (smtpErr) {
      console.error('⚠️ SMTP Dispatch Failure:', smtpErr.message);
      // Fallback to Resend API if available
      const fallbackKey = process.env.RESEND_API_KEY || resendApiKey;
      if (fallbackKey) {
        try {
          const fallbackResend = new Resend(fallbackKey);
          const fallbackFrom = process.env.EMAIL_FROM || fromEmail;
          const { data, error } = await fallbackResend.emails.send({
            from: fallbackFrom,
            to: [cleanEmail],
            subject: `${otp} is your Ambedkar Digital Archive verification code`,
            html: buildOtpEmailHtml(otp, cleanEmail),
            text: `Your Dr. B. R. Ambedkar Digital Heritage Archive verification code is: ${otp}\n\nValid for 5 minutes. Never share this code with anyone.`,
          });
          if (!error && data) {
            return {
              success: true,
              messageId: data.id,
              provider: 'resend_fallback',
            };
          }
        } catch (fbErr) {
          console.warn('⚠️ Resend fallback failed:', fbErr.message);
        }
      }
      const err = new Error('Failed to dispatch email verification code via Gmail SMTP.');
      err.statusCode = 400;
      err.code = 'EMAIL_DISPATCH_FAILED';
      throw err;
    }
  }

  // 2. Resend Provider Branch
  if (provider === 'resend') {
    const activeKey = process.env.RESEND_API_KEY || resendApiKey;
    const activeResend = activeKey ? new Resend(activeKey) : null;
    const activeFrom = process.env.EMAIL_FROM || fromEmail;

    if (!activeResend || !activeKey) {
      const err = new Error('Resend provider selected but RESEND_API_KEY is missing.');
      err.statusCode = 400;
      err.code = 'EMAIL_CONFIG_MISSING';
      throw err;
    }

    try {
      const { data, error } = await activeResend.emails.send({
        from: activeFrom,
        to: [cleanEmail],
        subject: `${otp} is your Ambedkar Digital Archive verification code`,
        html: buildOtpEmailHtml(otp, cleanEmail),
        text: `Your Dr. B. R. Ambedkar Digital Heritage Archive verification code is: ${otp}\n\nValid for 5 minutes. Never share this code with anyone.`,
      });

      if (error) {
        console.error('⚠️ Resend Dispatch Failure:', error.message || error.name);
        const err = new Error(error.message || 'Failed to dispatch email verification code via Resend.');
        err.statusCode = 400;
        err.code = 'EMAIL_DISPATCH_FAILED';
        throw err;
      }

      return {
        success: true,
        messageId: data ? data.id : 'resend-' + Date.now(),
        provider: 'resend',
      };
    } catch (apiErr) {
      console.error('⚠️ Resend Exception:', apiErr.message);
      if (!apiErr.statusCode) {
        apiErr.statusCode = 400;
        apiErr.code = 'EMAIL_DISPATCH_FAILED';
      }
      throw apiErr;
    }
  }

  // 3. Safe Development Console Simulator (Only when no external provider is configured)
  if (process.env.NODE_ENV !== 'production' || process.env.DEV_AUTH_MODE === 'true') {
    console.log(`\n======================================================`);
    console.log(`✉️ [EMAIL OTP CONSOLE SIMULATION — NO PROVIDER CONFIGURED]`);
    console.log(`📬 To: ${cleanEmail}`);
    console.log(`🔑 Verification OTP: >>> ${otp} <<<`);
    console.log(`⏳ Valid for: 5 Minutes`);
    console.log(`💡 Configure GMAIL_USER & GMAIL_APP_PASSWORD in .env for real delivery`);
    console.log(`======================================================\n`);
    return {
      success: true,
      isDevMode: true,
      messageId: 'dev-sim-' + Date.now(),
      provider: 'dev_console',
    };
  }

  throw new Error('No valid email provider configured. Please configure Gmail SMTP or Resend credentials.');
}

module.exports = {
  sendEmailOtp,
  buildOtpEmailHtml,
};
