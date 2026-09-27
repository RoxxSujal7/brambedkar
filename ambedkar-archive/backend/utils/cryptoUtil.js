/**
 * cryptoUtil.js — Cryptographic Utility Suite (SHA-256 / SHA-512 & Timing-Safe Primitives)
 * Provides:
 *  1. SHA-256 / SHA-512 hex digest hashing
 *  2. SHA-256 password pre-hashing (OWASP standard to prevent bcrypt 72-byte truncation)
 *  3. SHA-256 OTP hashing with constant-time timing-safe comparison
 *  4. Archival document SHA-256 streaming checksum verification
 */

const crypto = require('crypto');
const fs = require('fs');
const bcrypt = require('bcryptjs');

/**
 * Generate SHA-256 hex hash of any string/buffer input
 * @param {string|Buffer} data
 * @returns {string} 64-character lowercase hex string
 */
function sha256(data) {
  return crypto.createHash('sha256').update(String(data)).digest('hex');
}

/**
 * Generate SHA-512 hex hash of any string/buffer input
 * @param {string|Buffer} data
 * @returns {string} 128-character lowercase hex string
 */
function sha512(data) {
  return crypto.createHash('sha512').update(String(data)).digest('hex');
}

/**
 * Generate HMAC-SHA256 signature
 * @param {string|Buffer} data
 * @param {string} key
 * @returns {string}
 */
function hmacSha256(data, key) {
  return crypto.createHmac('sha256', key).update(String(data)).digest('hex');
}

/**
 * Hash password with SHA-256 pre-hashing + Bcrypt (12 rounds)
 * Normalizes any password length into a 64-char hex string before Bcrypt,
 * preventing Bcrypt 72-byte null truncation attacks and DoS.
 * @param {string} plainPassword
 * @param {number} rounds
 * @returns {Promise<string>}
 */
async function hashPassword(plainPassword, rounds = 12) {
  const preHashed = sha256(plainPassword);
  return await bcrypt.hash(preHashed, rounds);
}

/**
 * Compare password against stored hash:
 * 1. Tests SHA-256 pre-hashed candidate
 * 2. Falls back to raw candidate for backward compatibility with legacy hashes
 * @param {string} candidatePassword
 * @param {string} storedHash
 * @returns {Promise<boolean>}
 */
async function comparePassword(candidatePassword, storedHash) {
  if (!candidatePassword || !storedHash) return false;

  // Primary check: SHA-256 pre-hashed candidate
  const preHashed = sha256(candidatePassword);
  const matchSHA = await bcrypt.compare(preHashed, storedHash);
  if (matchSHA) return true;

  // Legacy fallback: direct Bcrypt compare (for accounts created before SHA pre-hashing)
  return await bcrypt.compare(candidatePassword, storedHash);
}

/**
 * Hash an OTP code with SHA-256 before in-memory or DB storage
 * @param {string|number} otp
 * @returns {string}
 */
function hashOtp(otp) {
  return sha256(String(otp).trim());
}

/**
 * Verify an OTP code using SHA-256 and constant-time comparison
 * @param {string} storedHash - SHA-256 hash stored in memory/db
 * @param {string|number} candidateOtp - User-submitted OTP code
 * @returns {boolean}
 */
function verifyOtp(storedHash, candidateOtp) {
  if (!storedHash || !candidateOtp) return false;
  const candidateHash = hashOtp(candidateOtp);
  try {
    const a = Buffer.from(storedHash, 'utf8');
    const b = Buffer.from(candidateHash, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    return false;
  }
}

/**
 * Stream and calculate SHA-256 checksum for a file on disk
 * @param {string} filePath
 * @returns {Promise<string>}
 */
function calculateFileSHA256(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File not found: ${filePath}`));
    }
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => reject(err));
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function timingSafeEqualStr(aStr, bStr) {
  if (typeof aStr !== 'string' || typeof bStr !== 'string') return false;
  try {
    const a = Buffer.from(aStr, 'utf8');
    const b = Buffer.from(bStr, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    return false;
  }
}

module.exports = {
  sha256,
  sha512,
  hmacSha256,
  hashPassword,
  comparePassword,
  hashOtp,
  verifyOtp,
  timingSafeEqualStr,
  calculateFileSHA256,
};
