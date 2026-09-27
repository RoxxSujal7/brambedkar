/**
 * whatsappOtpService.js — Real WhatsApp OTP Delivery Service
 * Primary: Meta WhatsApp Cloud API (Graph API v20.0)
 * Secondary: Twilio Verify WhatsApp Channel
 * Resilient: Development console simulation mode with Indian (+91) E.164 normalization
 */

/**
 * Normalize and validate Indian mobile phone numbers to strict E.164 format (+91XXXXXXXXXX)
 * @param {string} rawPhone
 * @returns {{ valid: boolean, e164: string, display: string, error?: string }}
 */
function normalizeIndianPhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { valid: false, e164: '', display: '', error: 'Phone number is required.' };
  }

  // Remove whitespace, dashes, parens, dots
  let digits = rawPhone.replace(/[\s\-\(\)\.]/g, '');

  // Handle + prefix
  if (digits.startsWith('+')) {
    digits = digits.slice(1);
  }

  // Strip leading 0 if present (e.g. 09876543210)
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  // Handle country code 91
  let nationalNumber = digits;
  if (digits.startsWith('91') && digits.length === 12) {
    nationalNumber = digits.slice(2);
  }

  // Validate Indian mobile numbers: exactly 10 digits, starts with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(nationalNumber)) {
    return {
      valid: false,
      e164: '',
      display: '',
      error: 'Please enter a valid 10-digit Indian mobile number (e.g., 98765 43210).',
    };
  }

  const e164 = `+91${nationalNumber}`;
  const display = `+91 ${nationalNumber.slice(0, 5)} ${nationalNumber.slice(5)}`;

  return { valid: true, e164, display };
}

/**
 * Send WhatsApp OTP via Meta WhatsApp Cloud API (Graph API)
 */
async function sendViaMetaCloud(e164Phone, otp) {
  const token = process.env.WHATSAPP_CLOUD_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return null;
  }

  const recipientDigits = e164Phone.replace('+', '');
  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  // Try Authentication Template if template name configured, or standard message
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME || '';
  let payload;

  if (templateName) {
    payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientDigits,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: otp }],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [{ type: 'text', text: otp }],
          },
        ],
      },
    };
  } else {
    // Direct text message (works in development sandbox with verified recipients)
    payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientDigits,
      type: 'text',
      text: {
        body: `🏛️ *Dr. B. R. Ambedkar Digital Heritage Archive*\n\nYour 6-digit verification code is: *${otp}*\n\nValid for 5 minutes. Do not share this code with anyone.`,
      },
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      (data.error && data.error.message) || `Meta WhatsApp Cloud API error (HTTP ${response.status})`
    );
  }

  return {
    success: true,
    provider: 'meta_cloud',
    messageId: data.messages && data.messages[0] ? data.messages[0].id : 'meta-ok',
  };
}

/**
 * Send WhatsApp OTP via Twilio Verify (alternative driver)
 */
async function sendViaTwilio(e164Phone, otp) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!sid || !token || !serviceSid) {
    return null;
  }

  const url = `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`;
  const authHeader = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');

  const params = new URLSearchParams({
    To: e164Phone,
    Channel: 'whatsapp',
    CustomCode: otp,
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Twilio Verify error (HTTP ${res.status})`);
  }

  return {
    success: true,
    provider: 'twilio_verify',
    messageId: data.sid || 'twilio-ok',
  };
}

/**
 * Main WhatsApp OTP dispatch entry point
 * @param {string} rawPhone - User phone number input
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<{ success: boolean, e164: string, display: string, provider: string, isDevMode?: boolean }>}
 */
async function sendWhatsAppOtp(rawPhone, otp) {
  const norm = normalizeIndianPhone(rawPhone);
  if (!norm.valid) {
    throw new Error(norm.error);
  }

  // 1. Attempt Meta WhatsApp Cloud API
  try {
    const metaResult = await sendViaMetaCloud(norm.e164, otp);
    if (metaResult) {
      return { ...metaResult, e164: norm.e164, display: norm.display };
    }
  } catch (err) {
    console.error('⚠️ Meta WhatsApp Cloud API dispatch failed:', err.message);
    if (process.env.NODE_ENV === 'production' && process.env.DEV_AUTH_MODE !== 'true') {
      throw err;
    }
  }

  // 2. Attempt Twilio Verify if configured
  try {
    const twilioResult = await sendViaTwilio(norm.e164, otp);
    if (twilioResult) {
      return { ...twilioResult, e164: norm.e164, display: norm.display };
    }
  } catch (err) {
    console.error('⚠️ Twilio WhatsApp Verify dispatch failed:', err.message);
    if (process.env.NODE_ENV === 'production' && process.env.DEV_AUTH_MODE !== 'true') {
      throw err;
    }
  }

  // 3. Resilient development & test fallback
  if (process.env.NODE_ENV !== 'production' || process.env.DEV_AUTH_MODE === 'true') {
    console.log(`\n======================================================`);
    console.log(`💬 [REAL WHATSAPP OTP DISPATCH — DEV CONSOLE SIMULATION]`);
    console.log(`📱 Destination Phone (E.164): ${norm.e164} (${norm.display})`);
    console.log(`🔑 Verification OTP: >>> ${otp} <<<`);
    console.log(`⏳ Valid for: 5 Minutes (Expires: ${new Date(Date.now() + 300000).toLocaleTimeString()})`);
    console.log(`💡 To dispatch real WhatsApp messages:`);
    console.log(`   Set WHATSAPP_CLOUD_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env`);
    console.log(`======================================================\n`);
    return {
      success: true,
      provider: 'dev_console_simulation',
      isDevMode: true,
      e164: norm.e164,
      display: norm.display,
      messageId: 'dev-wa-' + Date.now(),
    };
  }

  throw new Error('WhatsApp delivery service is not configured (missing WHATSAPP_CLOUD_TOKEN).');
}

module.exports = {
  normalizeIndianPhone,
  sendWhatsAppOtp,
};
