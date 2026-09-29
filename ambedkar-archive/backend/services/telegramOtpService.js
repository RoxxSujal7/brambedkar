/**
 * telegramOtpService.js — 100% Free Official Telegram Phone & Username OTP Delivery Service
 * Uses official Telegram Bot API (https://api.telegram.org)
 * Permanent $0 cost, unlimited messages, zero ban risk.
 * Integrated with MongoDB Atlas for serverless persistence across Vercel instances.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const mongoose = require('mongoose');

let TelegramContact = null;
try {
  TelegramContact = require('../models/TelegramContact');
} catch (_) {}

function isDbConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

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
 * Load contacts from seed, local JSON file, /tmp fallback, and MongoDB Atlas
 */
async function loadContacts() {
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
      if (data.phones) Object.entries(data.phones).forEach(([k, v]) => phoneChatMap.set(k, v));
      if (data.usernames) Object.entries(data.usernames).forEach(([k, v]) => usernameChatMap.set(k, v));
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

  // 3. Load from /tmp fallback
  try {
    if (fs.existsSync(TMP_CONTACTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(TMP_CONTACTS_FILE, 'utf8'));
      if (data.phones) Object.entries(data.phones).forEach(([k, v]) => phoneChatMap.set(k, v));
      if (data.usernames) Object.entries(data.usernames).forEach(([k, v]) => usernameChatMap.set(k, v));
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

  // 4. Load from MongoDB Atlas (guaranteed persistence across all serverless lambdas)
  if (isDbConnected() && TelegramContact) {
    try {
      const docs = await TelegramContact.find({}).lean();
      docs.forEach((doc) => {
        if (doc.chatId) {
          knownChatIds.add(String(doc.chatId));
          knownChatIds.add(Number(doc.chatId));
        }
        if (doc.username) {
          usernameChatMap.set(doc.username.toLowerCase(), doc.chatId);
        }
        if (doc.phone) {
          phoneChatMap.set(doc.phone, doc.chatId);
        }
        if (doc.tenDigits) {
          phoneChatMap.set(doc.tenDigits, doc.chatId);
        }
      });
    } catch (e) {
      // Non-fatal MongoDB load error
    }
  }
}

/**
 * Persist contact to memory, file, and MongoDB Atlas
 */
async function persistContact({ chatId, username, phone, tenDigits, firstName }) {
  if (!chatId) return;
  const strChatId = String(chatId);

  knownChatIds.add(strChatId);
  knownChatIds.add(Number(chatId));

  if (username) {
    usernameChatMap.set(username.toLowerCase(), chatId);
  }
  if (phone) {
    phoneChatMap.set(phone, chatId);
  }
  if (tenDigits) {
    phoneChatMap.set(tenDigits, chatId);
  }

  // Also sync to file /tmp fallback
  saveContacts();

  // Save to MongoDB Atlas
  if (isDbConnected() && TelegramContact) {
    try {
      const updateData = {
        chatId: strChatId,
        lastSeenAt: new Date(),
      };
      if (username) updateData.username = username.toLowerCase();
      if (phone) updateData.phone = phone;
      if (tenDigits) updateData.tenDigits = tenDigits;
      if (firstName) updateData.firstName = firstName;

      await TelegramContact.findOneAndUpdate(
        { chatId: strChatId },
        { $set: updateData },
        { upsert: true, new: true }
      );
    } catch (e) {
      // Non-fatal
    }
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
loadContacts().catch(() => {});

/**
 * Extract clean 10-digit Indian phone suffix or international phone if applicable
 * Accurately distinguishes between phone numbers and Telegram Chat IDs.
 * @param {string} raw
 * @returns {{ isPhone: boolean, digits: string, e164: string, tenDigits: string }}
 */
function parsePhoneNumber(raw) {
  const clean = String(raw || '').trim();
  const digits = clean.replace(/\D/g, '');

  // 1. Explicit E.164 phone starting with +
  if (clean.startsWith('+')) {
    if (digits.length >= 10 && digits.length <= 15) {
      const tenDigits = digits.length >= 10 ? digits.slice(-10) : digits;
      return { isPhone: true, digits, e164: `+${digits}`, tenDigits };
    }
  }

  // 2. Standard 10-digit Indian Mobile (starts with 6, 7, 8, 9)
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return { isPhone: true, digits, e164: `+91${digits}`, tenDigits: digits };
  }

  // 3. 12-digit Indian Mobile with 91 prefix (91[6-9]XXXXXXXX)
  if (digits.length === 12 && /^91[6-9]/.test(digits)) {
    const ten = digits.slice(2);
    return { isPhone: true, digits, e164: `+${digits}`, tenDigits: ten };
  }

  // 4. Raw digits starting with 0 followed by 10 digits starting with [6-9]
  if (digits.length === 11 && digits.startsWith('0') && /^[6-9]/.test(digits.slice(1))) {
    const ten = digits.slice(1);
    return { isPhone: true, digits: ten, e164: `+91${ten}`, tenDigits: ten };
  }

  // Not an unambiguous phone number — could be a Telegram username, numeric Chat ID, etc.
  return { isPhone: false, digits, e164: '', tenDigits: '' };
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
 * Persists all newly discovered contacts to MongoDB Atlas.
 * @param {string} token
 * @param {string} botUsername
 */
async function syncUpdates(token, botUsername) {
  if (!token) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result)) return;

    for (const update of data.result) {
      const msg = update.message || update.edited_message || update.channel_post;
      if (!msg) continue;

      const chatId = msg.chat?.id || msg.from?.id;
      if (!chatId) continue;

      const fromUser = msg.from?.username?.toLowerCase();
      const chatUser = msg.chat?.username?.toLowerCase();
      const activeUser = fromUser || chatUser;
      const firstName = msg.from?.first_name || msg.chat?.first_name;

      let phoneInfo = null;

      // 1. Check for shared contact (from "Share Phone Number" button)
      if (msg.contact && msg.contact.phone_number) {
        const rawPhone = msg.contact.phone_number;
        const parsed = parsePhoneNumber(rawPhone);
        if (parsed.isPhone) {
          phoneInfo = parsed;
          sendContactConfirmation(token, chatId, parsed.e164);
        }
      }

      // 2. Check for phone number typed as text
      if (msg.text && !msg.text.startsWith('/')) {
        const parsed = parsePhoneNumber(msg.text);
        if (parsed.isPhone) {
          phoneInfo = parsed;
        }
      }

      // 3. Acknowledge /start command with interactive reply
      if (msg.text && msg.text.startsWith('/start')) {
        sendStartGreeting(token, chatId, activeUser);
      }

      // Persist contact across memory, local fallback, and MongoDB Atlas
      await persistContact({
        chatId,
        username: activeUser,
        phone: phoneInfo ? phoneInfo.e164 : undefined,
        tenDigits: phoneInfo ? phoneInfo.tenDigits : undefined,
        firstName,
      });
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

  const parsed = parsePhoneNumber(cleanTarget);
  const cleanUser = cleanTarget.replace(/^@/, '').toLowerCase();

  // 1. Check in-memory maps
  if (parsed.isPhone) {
    if (phoneChatMap.has(parsed.tenDigits)) return phoneChatMap.get(parsed.tenDigits);
    if (phoneChatMap.has(parsed.e164)) return phoneChatMap.get(parsed.e164);
  }

  if (usernameChatMap.has(cleanUser)) {
    return usernameChatMap.get(cleanUser);
  }

  if (knownChatIds.has(cleanTarget) || knownChatIds.has(Number(cleanTarget))) {
    return cleanTarget;
  }

  // 2. Check MongoDB Atlas for persisted contacts (across serverless instances)
  if (isDbConnected() && TelegramContact) {
    try {
      const orQueries = [{ chatId: cleanTarget }];
      if (cleanUser) orQueries.push({ username: cleanUser });
      if (parsed.isPhone) {
        if (parsed.e164) orQueries.push({ phone: parsed.e164 });
        if (parsed.tenDigits) orQueries.push({ tenDigits: parsed.tenDigits });
      }

      const existingDoc = await TelegramContact.findOne({ $or: orQueries }).lean();
      if (existingDoc && existingDoc.chatId) {
        // Cache in memory and return
        knownChatIds.add(String(existingDoc.chatId));
        if (existingDoc.username) usernameChatMap.set(existingDoc.username.toLowerCase(), existingDoc.chatId);
        if (existingDoc.phone) phoneChatMap.set(existingDoc.phone, existingDoc.chatId);
        if (existingDoc.tenDigits) phoneChatMap.set(existingDoc.tenDigits, existingDoc.chatId);
        return existingDoc.chatId;
      }
    } catch (e) {
      // Non-fatal MongoDB lookup error
    }
  }

  // 3. Try live sync from Telegram API
  await syncUpdates(token, botUsername);

  // Check in-memory mappings again after live sync
  if (parsed.isPhone) {
    if (phoneChatMap.has(parsed.tenDigits)) return phoneChatMap.get(parsed.tenDigits);
    if (phoneChatMap.has(parsed.e164)) return phoneChatMap.get(parsed.e164);
  }

  if (usernameChatMap.has(cleanUser)) {
    return usernameChatMap.get(cleanUser);
  }

  if (knownChatIds.has(cleanTarget) || knownChatIds.has(Number(cleanTarget))) {
    return cleanTarget;
  }

  // Check MongoDB again after sync
  if (isDbConnected() && TelegramContact) {
    try {
      const orQueries = [{ chatId: cleanTarget }];
      if (cleanUser) orQueries.push({ username: cleanUser });
      if (parsed.isPhone) {
        if (parsed.e164) orQueries.push({ phone: parsed.e164 });
        if (parsed.tenDigits) orQueries.push({ tenDigits: parsed.tenDigits });
      }
      const reDoc = await TelegramContact.findOne({ $or: orQueries }).lean();
      if (reDoc && reDoc.chatId) return reDoc.chatId;
    } catch (_) {}
  }

  // 4. If target is a numeric ID (7-14 digits) and user didn't explicitly format as international phone (+91...)
  // Test if it is a direct valid Telegram Chat ID via official getChat API
  if (/^-?\d{7,14}$/.test(cleanTarget) && !cleanTarget.startsWith('+')) {
    try {
      const chatRes = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${cleanTarget}`);
      const chatData = await chatRes.json();
      if (chatData && chatData.ok && chatData.result) {
        // Active chat exists! Persist to MongoDB and return
        await persistContact({
          chatId: cleanTarget,
          username: chatData.result.username,
          firstName: chatData.result.first_name,
        });
        return cleanTarget;
      }
    } catch (e) {}
  }

  // 5. If it was an Indian / E.164 phone number, report clean helpful instructions
  if (parsed.isPhone) {
    const err = new Error(
      `Mobile number ${parsed.e164} is not yet linked to Telegram. Open https://t.me/${botUsername} in Telegram and tap 'Share Phone Number' to link it.`
    );
    err.statusCode = 400;
    err.code = 'TELEGRAM_NOT_LINKED';
    throw err;
  }

  // 6. Otherwise report accurate, helpful unlinked error
  const err = new Error(
    `No Telegram chat found for ${cleanTarget.startsWith('@') ? cleanTarget : '@' + cleanTarget}. Please open https://t.me/${botUsername} in Telegram, click START, and try again.`
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
  loadContacts,
  persistContact,
};
