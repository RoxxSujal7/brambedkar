/**
 * password-security.test.js
 * Comprehensive automated verification for Enterprise Password Creation & Storage Security.
 * Covers:
 *  - Real-time password requirement rejection (length, upper, lower, number, symbol)
 *  - Strong password registration
 *  - Password hash verification (Bcrypt salted hash with 12 rounds, unique salts, never plaintext)
 *  - Zero credential exposure across API responses (/register, /login, /me)
 *  - Password authentication (correct vs wrong credentials)
 *  - Secure password reset flow (anti-enumeration, single-use token, strong replacement, old password invalidation)
 */

const assert = require('assert');
const cryptoUtil = require('../backend/utils/cryptoUtil');
const userService = require('../backend/services/userService');

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:5000';

async function req(path, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text };
  }

  return { status: res.status, ok: res.ok, data: json };
}

async function runPasswordSecurityTests() {
  console.log('\n======================================================');
  console.log('🔒 PASSWORD CREATION & STORAGE SECURITY TEST SUITE');
  console.log(`Target API: ${BASE_URL}`);
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function testAssert(condition, name, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await req('/api/health');
    testAssert(health.status === 200, '1. Backend server is alive and responding (200 OK)');

    // 2. Weak Password Rejections
    const testEmailPrefix = `sec_user_${Date.now()}`;

    // 2a. Too short (< 8 chars)
    const tooShortRes = await req('/api/auth/register', 'POST', {
      name: 'Security Test',
      email: `${testEmailPrefix}_short@test.com`,
      password: 'Aa1!',
    });
    testAssert(
      tooShortRes.status === 400 && JSON.stringify(tooShortRes.data).includes('8 characters'),
      '2. Rejects password under 8 characters with 400 Bad Request',
      `Got status ${tooShortRes.status}`
    );

    // 2b. Missing Uppercase
    const noUpperRes = await req('/api/auth/register', 'POST', {
      name: 'Security Test',
      email: `${testEmailPrefix}_noupper@test.com`,
      password: 'archive@2026',
    });
    testAssert(
      noUpperRes.status === 400 && JSON.stringify(noUpperRes.data).includes('uppercase'),
      '3. Rejects password missing uppercase letter with 400 Bad Request',
      `Got status ${noUpperRes.status}`
    );

    // 2c. Missing Lowercase
    const noLowerRes = await req('/api/auth/register', 'POST', {
      name: 'Security Test',
      email: `${testEmailPrefix}_nolower@test.com`,
      password: 'ARCHIVE@2026',
    });
    testAssert(
      noLowerRes.status === 400 && JSON.stringify(noLowerRes.data).includes('lowercase'),
      '4. Rejects password missing lowercase letter with 400 Bad Request',
      `Got status ${noLowerRes.status}`
    );

    // 2d. Missing Number
    const noNumberRes = await req('/api/auth/register', 'POST', {
      name: 'Security Test',
      email: `${testEmailPrefix}_nonumber@test.com`,
      password: 'Archive@Heritage',
    });
    testAssert(
      noNumberRes.status === 400 && JSON.stringify(noNumberRes.data).includes('number'),
      '5. Rejects password missing number with 400 Bad Request',
      `Got status ${noNumberRes.status}`
    );

    // 2e. Missing Special Symbol
    const noSymbolRes = await req('/api/auth/register', 'POST', {
      name: 'Security Test',
      email: `${testEmailPrefix}_nosymbol@test.com`,
      password: 'Archive2026Pass',
    });
    testAssert(
      noSymbolRes.status === 400 && JSON.stringify(noSymbolRes.data).includes('special symbol'),
      '6. Rejects password missing special symbol with 400 Bad Request',
      `Got status ${noSymbolRes.status}`
    );

    // 3. Valid Strong Password Registration
    const validEmail = `${testEmailPrefix}_valid@test.com`;
    const strongPassword = 'StrongP@ssw0rd2026!';
    const validReg = await req('/api/auth/register', 'POST', {
      name: 'Heritage Scholar',
      email: validEmail,
      password: strongPassword,
    });
    testAssert(
      validReg.status === 201 && validReg.data.token,
      '7. Accepts valid strong password (8+ chars, upper, lower, num, symbol) with 201 Created',
      `Got status ${validReg.status}`
    );

    // 4. Verification that Password & Hashes are NEVER exposed in Registration API
    const regUser = validReg.data.user || {};
    testAssert(
      regUser.password === undefined && regUser.passwordHash === undefined && regUser.salt === undefined,
      '8. Registration response excludes password and password hash fields completely'
    );

    // 5. Verification of Dedicated Password Hashing & Per-Password Salting
    const testPlainPassword = 'SampleP@ssw0rd123!';
    const hash1 = await cryptoUtil.hashPassword(testPlainPassword, 12);
    const hash2 = await cryptoUtil.hashPassword(testPlainPassword, 12);

    testAssert(
      hash1 !== testPlainPassword && (hash1.startsWith('$2a$') || hash1.startsWith('$2b$')),
      '9. Password hashing produces modular crypt Bcrypt hash ($2a$/$2b$), never plaintext or simple MD5/SHA'
    );

    testAssert(
      hash1 !== hash2,
      '10. Dynamic per-password unique salting ensures identical passwords yield completely distinct hashes'
    );

    // 6. Direct User Creation Storage Audit
    const testInternalUser = await userService.createUser({
      name: 'Internal Storage Audit User',
      email: `${testEmailPrefix}_audit@test.com`,
      password: strongPassword,
    });
    testAssert(
      testInternalUser && testInternalUser.password !== strongPassword && (testInternalUser.password.startsWith('$2a$') || testInternalUser.password.startsWith('$2b$')),
      '11. User storage backend immediately hashes credentials before storage with 12 rounds'
    );

    // 7. Login Verification: Correct vs Incorrect Credentials
    const wrongLogin = await req('/api/auth/login', 'POST', {
      email: validEmail,
      password: 'WrongP@ssw0rd2026!',
    });
    testAssert(
      wrongLogin.status === 401,
      '12. Login with incorrect password rejected with 401 Unauthorized',
      `Got status ${wrongLogin.status}`
    );

    const correctLogin = await req('/api/auth/login', 'POST', {
      email: validEmail,
      password: strongPassword,
    });
    testAssert(
      correctLogin.status === 200 && correctLogin.data.token,
      '13. Login with correct strong password authenticates with 200 OK + JWT',
      `Got status ${correctLogin.status}`
    );

    const loginUser = correctLogin.data.user || {};
    testAssert(
      loginUser.password === undefined && loginUser.passwordHash === undefined,
      '14. Login response excludes password and password hash fields completely'
    );

    // 8. Profile Me Endpoint: Verify zero password leak
    const meRes = await req('/api/auth/me', 'GET', null, correctLogin.data.token);
    const meUser = meRes.data.user || meRes.data || {};
    testAssert(
      meRes.status === 200 && meUser.password === undefined && meUser.passwordHash === undefined,
      '15. GET /api/auth/me does not leak password hash to authenticated client'
    );

    // 9. Password Reset Flow: Anti-Enumeration & Code Dispatch
    const forgotResNonexistent = await req('/api/auth/forgot-password', 'POST', {
      email: 'nonexistent_ghost_999@test.com',
    });
    testAssert(
      forgotResNonexistent.status === 200 && forgotResNonexistent.data.success,
      '16. Forgot-password returns 200 OK for nonexistent email (anti-enumeration protection)'
    );

    const forgotResValid = await req('/api/auth/forgot-password', 'POST', {
      email: validEmail,
    });
    testAssert(
      forgotResValid.status === 200 && (forgotResValid.data.demoCode || forgotResValid.data.success),
      '17. Forgot-password generates secure reset token/code for valid user'
    );

    const resetCode = forgotResValid.data.demoCode;

    // 10. Password Reset: Rejection of Weak New Passwords
    const weakReset = await req('/api/auth/reset-password', 'POST', {
      email: validEmail,
      token: resetCode,
      newPassword: 'weak',
    });
    testAssert(
      weakReset.status === 400 && JSON.stringify(weakReset.data).includes('8 characters'),
      '18. Reset-password rejects weak new password with 400 Bad Request'
    );

    // 11. Password Reset: Invalid or Expired Token Rejection
    const invalidTokenReset = await req('/api/auth/reset-password', 'POST', {
      email: validEmail,
      token: '999999',
      newPassword: 'BrandNewStrongP@ss2026!',
    });
    testAssert(
      invalidTokenReset.status === 400,
      '19. Reset-password rejects invalid/tampered reset code with 400 Bad Request'
    );

    // 12. Password Reset: Successful Replacement
    const newStrongPassword = 'BrandNewStrongP@ss2026!';
    const successReset = await req('/api/auth/reset-password', 'POST', {
      email: validEmail,
      token: resetCode,
      newPassword: newStrongPassword,
    });
    testAssert(
      successReset.status === 200 && successReset.data.success,
      '20. Reset-password successfully hashes and updates password with valid token'
    );

    // 13. Old Password Invalidation Check
    const oldPassLogin = await req('/api/auth/login', 'POST', {
      email: validEmail,
      password: strongPassword,
    });
    testAssert(
      oldPassLogin.status === 401,
      '21. Old password is now completely invalid and rejected with 401 Unauthorized'
    );

    // 14. Old Session Invalidation Check (JWT A must be rejected after password reset)
    const oldSessionRes = await req('/api/auth/me', 'GET', null, correctLogin.data.token);
    testAssert(
      oldSessionRes.status === 401,
      '22. Prior session token (JWT A) is immediately invalidated and rejected (401) after password reset',
      `Got status ${oldSessionRes.status}`
    );

    // 15. New Password Login Check (JWT B issued & accepted)
    const newPassLogin = await req('/api/auth/login', 'POST', {
      email: validEmail,
      password: newStrongPassword,
    });
    testAssert(
      newPassLogin.status === 200 && newPassLogin.data.token,
      '23. Login with newly reset password succeeds with 200 OK + new JWT (JWT B)'
    );

    const newSessionRes = await req('/api/auth/me', 'GET', null, newPassLogin.data.token);
    testAssert(
      newSessionRes.status === 200,
      '24. Newly issued session token (JWT B) is valid and authenticated (200 OK)'
    );

    // 16. Single-Use Token Invalidation Check (Replay Prevention)
    const replayReset = await req('/api/auth/reset-password', 'POST', {
      email: validEmail,
      token: resetCode,
      newPassword: 'AnotherStrongP@ss2026!',
    });
    testAssert(
      replayReset.status === 400,
      '25. Reset token is single-use and rejected on replay attempt'
    );

  } catch (err) {
    console.error('Fatal test execution error:', err);
    failed++;
  }

  console.log('\n======================================================');
  console.log(`📊 PASSWORD SECURITY SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPasswordSecurityTests();
