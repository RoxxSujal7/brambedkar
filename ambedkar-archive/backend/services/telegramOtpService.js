/**
 * telegramOtpService.js — 100% Free Official Telegram Phone & Username OTP Delivery Service
 * Uses official Telegram Bot API (https://api.telegram.org)
 * Permanent $0 cost, unlimited messages, zero ban risk.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_CONTACTS_FILE = path.join(__dirname, '..', 'data', 'telegram_contacts.json');
const TMP_CONTACTS_FILE = path.join(os.tmpdir(), 'telegram_contacts.json');

// Memory caches
const phoneChatMap = new Map();
const usernameChatMap = new Map();
const knownChatIds = new Set();
const greetedChatIds = new Set();
const acknowledgedContacts = new Set();

// Verified seed contacts to guarantee baseline linkage across serverless cold starts
const SEED_CONTACTS = {
  phones: {
    '9334705234': 7637296797,
    '+919334705234': 7637296797,
  },
  usernames: {
    'sujalroxx7': 7637296797,
  },
  chatIds: ['7637296797'],
};

/**
 * Load contacts from seed, local JSON file, and /tmp fallback
 */
function loadContacts() {
  // 1. Seed baseline
  if (SEED_CONTACTS.phones) {
    Object.entries(SEED_CONTACTS.phones).forEach(([k, v]) => phoneChatMap.set(k, v));
  }
  if (SEED_CONTACTS.usernames) {
    Object.entries(SEED_CONTACTS.usernames).forEach(([k, v]) => usernameChatMap.set(k, v));
  }
  if (SEED_CONTACTS.chatIds) {
    SEED_CONTACTS.chatIds.forEach((id) => {
      knownChatIds.add(String(id));
      knownChatIds.add(Number(id));
    });
  }

  // 2. Load from default file if present
  try {
    if (fs.existsSync(DEFAULT_CONTACTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(DEFAULT_CONTACTS_FILE, 'utf8'));
      if (data.phones) {
        Object.entries(data.phones).forEach(([k, v]) => phoneChatMap.set(k, v));
      }
      if (data.usernames) {
        Object.entries(data.usernames).forEach(([k, v]) => usernameChatMap.set(k, v));
      }
      if (Array.isArray(data.chatIds)) {
        data.chatIds.forEach((id) => {
          knownChatIds.add(String(id));
          knownChatIds.add(Number(id));
        });
      }
    }
  } catch (err) {
    console.warn('Could not read default telegram_contacts.json:', err.message);
  }

  // 3. Load from /tmp fallback (serverless persistence)
  try {
    if (fs.existsSync(TMP_CONTACTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(TMP_CONTACTS_FILE, 'utf8'));
      if (data.phones) {
        Object.entries(data.phones).forEach(([k, v]) => phoneChatMap.set(k, v));
      }
      if (data.usernames) {
        Object.entries(data.usernames).forEach(([k, v]) => usernameChatMap.set(k, v));
      }
      if (Array.isArray(data.chatIds)) {
        data.chatIds.forEach((id) => {
          knownChatIds.add(String(id));
          knownChatIds.add(Number(id));
        });
      }
    }
  } catch (err) {
    // Non-fatal
  }
}

/**
 * Save contacts to local JSON file or /tmp
 */
function saveContacts() {
  const phonesObj = {};
  phoneChatMap.forEach((v, k) => { phonesObj[k] = v; });

  const usernamesObj = {};
  usernameChatMap.forEach((v, k) => { usernamesObj[k] = v; });

  const payload = JSON.stringify({
    updatedAt: new Date().toISOString(),
    phones: phonesObj,
    usernames: usernamesObj,
    chatIds: Array.from(knownChatIds),
  }, null, 2);

  // Try saving to default directory first
  let saved = false;
  try {
    const dir = path.dirname(DEFAULT_CONTACTS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DEFAULT_CONTACTS_FILE, payload, 'utf8');
    saved = true;
  } catch (err) {
    // EROFS on serverless (AWS Lambda / Vercel)
  }

  // Also save to /tmp for serverless container reuse
  try {
    fs.writeFileSync(TMP_CONTACTS_FILE, payload, 'utf8');
    saved = true;
  } catch (err) {
    if (!saved) {
      console.warn('Could not save telegram_contacts to /tmp:', err.message);
    }
  }
}

// Initial load
loadContacts();

/**
 * Extract clean 10-digit Indian phone suffix if applicable
 * @param {string} raw
 * @returns {{ isPhone: boolean, digits: string, e164: string, tenDigits: string }}
 */
function parsePhoneNumber(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) {
    return { isPhone: true, digits, e164: `+91${digits}`, tenDigits: digits };
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    const ten = digits.slice(2);
    return { isPhone: true, digits, e164: `+${digits}`, tenDigits: ten };
  }
  if (digits.length > 7 && digits.length <= 15 && (String(raw).startsWith('+') || String(raw).startsWith('0') || /^\d+$/.test(raw))) {
    return { isPhone: true, digits, e164: `+${digits}`, tenDigits: digits.slice(-10) };
  }
  return { isPhone: false, digits: '', e164: '', tenDigits: '' };
}

/**
 * Send interactive greeting back to Telegram user if they just pressed /start
 * @param {string} token
 * @param {number|string} chatId
 * @param {string} username
 */
async function sendStartGreeting(token, chatId, username) {
  if (greetedChatIds.has(chatId)) return;
  greetedChatIds.add(chatId);

  try {
    const userLabel = username ? `@${username}` : 'User';
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🏛️ *Dr. B. R. Ambedkar Digital Heritage Archive*\n\n✅ *Telegram Account Connected!*\n\n• Username: *${userLabel}*\n• Telegram ID: \`${chatId}\`\n\n👉 You can now log in at https://ambedkar-archive.vercel.app/login.html using your username (*${userLabel}*) or your Telegram ID (*${chatId}*).\n\n📱 *To log in with your phone number, tap 'Share Phone Number' below:*`,
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{ text: '📱 Share Phone Number', request_contact: true }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }),
    });
  } catch (e) {
    // Non-fatal
  }
}

/**
 * Send contact confirmation back to Telegram user
 * @param {string} token
 * @param {number|string} chatId
 * @param {string} phoneE164
 */
async function sendContactConfirmation(token, chatId, phoneE164) {
  if (acknowledgedContacts.has(chatId)) return;
  acknowledgedContacts.add(chatId);

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `✅ *Mobile number linked successfully!*\n\nYour mobile number *${phoneE164}* is now linked to your archive account.\n\nYou can now log in at https://ambedkar-archive.vercel.app/login.html using your mobile number.`,
        parse_mode: 'Markdown',
        reply_markup: { remove_keyboard: true },
      }),
    });
  } catch (e) {
    // Non-fatal
  }
}

/**
 * Sync updates from Telegram Bot API to discover users and contacts
 * @param {string} token
 * @param {string} botUsername
 */
async function syncUpdates(token, botUsername) {
  if (!token) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result)) return;

    let hasNew = false;
    for (const update of data.result) {
      const msg = update.message || update.edited_message || update.channel_post;
      if (!msg) continue;

      const chatId = msg.chat?.id || msg.from?.id;
      if (!chatId) continue;

      knownChatIds.add(String(chatId));
      knownChatIds.add(Number(chatId));

      const fromUser = msg.from?.username?.toLowerCase();
      const chatUser = msg.chat?.username?.toLowerCase();
      if (fromUser) {
        usernameChatMap.set(fromUser, chatId);
        hasNew = true;
      }
      if (chatUser) {
        usernameChatMap.set(chatUser, chatId);
        hasNew = true;
      }

      // 1. Check for shared contact (from "Share Phone Number" button)
      if (msg.contact && msg.contact.phone_number) {
        const rawPhone = msg.contact.phone_number;
        const parsed = parsePhoneNumber(rawPhone);
        if (parsed.isPhone) {
          phoneChatMap.set(parsed.tenDigits, chatId);
          phoneChatMap.set(parsed.e164, chatId);
          hasNew = true;
          sendContactConfirmation(token, chatId, parsed.e164);
        }
      }

      // 2. Check for phone number typed as text
      if (msg.text && !msg.text.startsWith('/')) {
        const parsed = parsePhoneNumber(msg.text);
        if (parsed.isPhone) {
          phoneChatMap.set(parsed.tenDigits, chatId);
          phoneChatMap.set(parsed.e164, chatId);
          hasNew = true;
        }
      }

      // 3. Acknowledge /start command with interactive reply
      if (msg.text && msg.text.startsWith('/start')) {
        sendStartGreeting(token, chatId, fromUser || chatUser);
      }
    }

    if (hasNew) {
      saveContacts();
    }
  } catch (err) {
    console.warn('Telegram syncUpdates error:', err.message);
  }
}

/**
 * Resolve phone number, username, or numeric chat ID to a Telegram chat_id
 * @param {string} token
 * @param {string} target
 * @param {string} botUsername
 * @returns {Promise<string|number>}
 */
async function resolveChatId(token, target, botUsername) {
  const cleanTarget = String(target || '').trim();
  if (!cleanTarget) {
    throw new Error('Telegram destination identifier is required.');
  }

  // 1. Direct match in phone mapping (e.g. 10-digit mobile or E.164)
  const parsed = parsePhoneNumber(cleanTarget);
  if (parsed.isPhone) {
    if (phoneChatMap.has(parsed.tenDigits)) {
      return phoneChatMap.get(parsed.tenDigits);
    }
    if (phoneChatMap.has(parsed.e164)) {
      return phoneChatMap.get(parsed.e164);
    }
  }

  // 2. Direct match in username mapping
  const cleanUser = cleanTarget.replace(/^@/, '').toLowerCase();
  if (usernameChatMap.has(cleanUser)) {
    return usernameChatMap.get(cleanUser);
  }

  // 3. Match against known Telegram numeric user/chat ID
  if (knownChatIds.has(cleanTarget) || knownChatIds.has(Number(cleanTarget))) {
    return cleanTarget;
  }

  // 4. Try live sync from Telegram API
  await syncUpdates(token, botUsername);

  // Check mappings again after live sync
  if (parsed.isPhone) {
    if (phoneChatMap.has(parsed.tenDigits)) {
      return phoneChatMap.get(parsed.tenDigits);
    }
    if (phoneChatMap.has(parsed.e164)) {
      return phoneChatMap.get(parsed.e164);
    }
  }

  if (usernameChatMap.has(cleanUser)) {
    return usernameChatMap.get(cleanUser);
  }

  if (knownChatIds.has(cleanTarget) || knownChatIds.has(Number(cleanTarget))) {
    return cleanTarget;
  }

  // 5. If it is a numeric ID and NOT a mobile phone number, treat as direct chat ID
  if (/^-?\d{7,14}$/.test(cleanTarget) && !cleanTarget.startsWith('+') && !parsed.isPhone) {
    return cleanTarget;
  }

  // 6. Otherwise report accurate, helpful unlinked error
  if (parsed.isPhone) {
    const err = new Error(
      `Mobile number ${parsed.e164} is not yet linked to Telegram. Open https://t.me/${botUsername} in Telegram and tap 'Share Phone Number' to link it.`
    );
    err.statusCode = 400;
    err.code = 'TELEGRAM_NOT_LINKED';
    throw err;
  }

  const err = new Error(
    `No Telegram chat found for @${cleanUser}. Please open https://t.me/${botUsername} in Telegram, click START, and try again.`
  );
  err.statusCode = 400;
  err.code = 'TELEGRAM_NOT_LINKED';
  throw err;
}

/**
 * Send OTP message to a user via Telegram Bot API
 * @param {string|number} target - Telegram Phone number, Chat ID, or username
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<{ success: boolean, messageId?: number, isDevMode?: boolean }>}
 */
async function sendTelegramOtp(target, otp) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'Ambedkararchivebot';

  const rawTarget = String(target || '').trim();
  if (!rawTarget) {
    throw new Error('Mobile number, Telegram @username, or Chat ID is required.');
  }

  // 1. If real Telegram Bot Token is configured, dispatch via official Telegram Bot API
  if (botToken) {
    try {
      const numericChatId = await resolveChatId(botToken, rawTarget, botUsername);

      const messageText = `🏛️ *Dr. B. R. Ambedkar Digital Heritage Archive*\n\nYour 6-digit verification code is: *${otp}*\n\n⏱️ Valid for 5 minutes.\n🛡️ Security Tip: Never share this code with anyone.`;
      
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: numericChatId,
          text: messageText,
          parse_mode: 'Markdown',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        console.warn('⚠️ Telegram API returned error:', data.description);
        if (data.description && data.description.includes('chat not found')) {
          const err = new Error(`Please open https://t.me/${botUsername} in Telegram and click START first, then request your code.`);
          err.statusCode = 400;
          err.code = 'TELEGRAM_NOT_LINKED';
          throw err;
        }
        const err = new Error(data.description || 'Failed to dispatch Telegram message.');
        err.statusCode = 400;
        err.code = 'TELEGRAM_SEND_FAILED';
        throw err;
      }

      return {
        success: true,
        messageId: data.result ? data.result.message_id : undefined,
        provider: 'telegram_bot_api',
      };
    } catch (err) {
      if (process.env.NODE_ENV !== 'production' || process.env.DEV_AUTH_MODE === 'true') {
        console.log(`[Telegram Dev Fallback] Code for ${rawTarget}: ${otp} (Reason: ${err.message})`);
        return { success: true, isDevMode: true, messageId: Date.now(), provider: 'dev_simulation', note: err.message };
      }
      throw err;
    }
  }

  // 2. Resilient dev/test simulation when bot token is not yet configured
  if (process.env.NODE_ENV !== 'production' || process.env.DEV_AUTH_MODE === 'true') {
    console.log(`\n======================================================`);
    console.log(`✈️ [100% FREE TELEGRAM OTP DISPATCH — DEV CONSOLE SIMULATION]`);
    console.log(`👤 Telegram Destination: ${rawTarget}`);
    console.log(`🔑 Verification OTP: >>> ${otp} <<<`);
    console.log(`⏳ Valid for: 5 Minutes (Expires: ${new Date(Date.now() + 300000).toLocaleTimeString()})`);
    console.log(`======================================================\n`);
    return {
      success: true,
      provider: 'dev_console_simulation',
      isDevMode: true,
      messageId: Date.now(),
    };
  }

  throw new Error('Telegram OTP service is not configured (missing TELEGRAM_BOT_TOKEN).');
}

module.exports = {
  sendTelegramOtp,
  syncUpdates,
  parsePhoneNumber,
  resolveChatId,
};
