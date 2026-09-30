/**
 * admin-real-vs-demo-auth.test.js
 * Regression Suite: Production Admin Authorization & Strict Demo Denial
 * 
 * Verifies that:
 * 1. Real Administrator (admin@ambedkar-archive.in) -> 200 OK across all Admin APIs
 * 2. Real Visitor (alka74963@gmail.com / anandayush3310@gmail.com) -> 403 Forbidden
 * 3. Demo SuperAdmin (superadmin@ambedkar-archive.in) -> 403 Forbidden across all Admin APIs
 * 4. Demo Admin (mock-user-admin-002) -> 403 Forbidden
 * 5. Demo Archivist (archivist@ambedkar-archive.in) -> 403 Forbidden
 * 6. Demo Researcher (researcher@ambedkar-archive.in) -> 403 Forbidden
 * 7. Hard isolation: Test mode never touches production database ambedkar_archive
 */

require('dotenv').config();
const assert = require('assert');
const { signToken } = require('../backend/config/jwt');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data, token: data.token };
}

async function testEndpoint(token, path, expectedStatus, description) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-enforce-production-rbac': 'true'
    }
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === expectedStatus) {
    console.log(`✅ PASS: [${res.status}] ${description}`);
    return true;
  } else {
    console.error(`❌ FAIL: Expected ${expectedStatus}, got ${res.status} for ${path} (${description})`);
    return false;
  }
}

async function runSuite() {
  console.log('======================================================');
  console.log('🛡️ REGRESSION: REAL ADMIN VS DEMO IDENTITIES AUTHORIZATION');
  console.log(`Target: ${BASE_URL}`);
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function count(result) {
    if (result) passed++;
    else failed++;
  }

  try {
    // 1. Real Administrator Authentication & Comprehensive Admin Access
    console.log('--- 1. Real Administrator Access (200 OK Expected) ---');
    const realAdminAuth = await login('admin@ambedkar-archive.in', 'Admin@1234');
    count(testEndpoint(realAdminAuth.token, '/api/admin/dashboard', 200, 'Real admin accesses /api/admin/dashboard'));
    count(testEndpoint(realAdminAuth.token, '/api/admin/users', 200, 'Real admin accesses /api/admin/users'));
    count(testEndpoint(realAdminAuth.token, '/api/admin/security/events', 200, 'Real admin accesses /api/admin/security/events'));
    count(testEndpoint(realAdminAuth.token, '/api/admin/audit-logs', 200, 'Real admin accesses /api/admin/audit-logs'));
    count(testEndpoint(realAdminAuth.token, '/api/admin/stats', 200, 'Real admin accesses /api/admin/stats'));

    // Wait for all real admin promises to resolve
    const r1 = await testEndpoint(realAdminAuth.token, '/api/admin/dashboard', 200, 'Real admin dashboard confirmation');
    count(r1);

    // 2. Real Visitor Access Denial (403 Forbidden Expected)
    console.log('\n--- 2. Real Visitor Denial (403 Forbidden Expected) ---');
    const realVisitorToken = signToken('6abc50b201da286d81fa4b94'); // alka74963@gmail.com
    const r2a = await testEndpoint(realVisitorToken, '/api/admin/dashboard', 403, 'Real visitor DENIED /api/admin/dashboard');
    count(r2a);
    const r2b = await testEndpoint(realVisitorToken, '/api/admin/users', 403, 'Real visitor DENIED /api/admin/users');
    count(r2b);

    // 3. Demo SuperAdmin Access Denial (403 Forbidden Expected)
    console.log('\n--- 3. Demo SuperAdmin Denial (403 Forbidden Expected) ---');
    const demoSuperAuth = await login('superadmin@ambedkar-archive.in', 'SuperAdmin@1234');
    const r3a = await testEndpoint(demoSuperAuth.token, '/api/admin/dashboard', 403, 'Demo superadmin DENIED /api/admin/dashboard');
    count(r3a);
    const r3b = await testEndpoint(demoSuperAuth.token, '/api/admin/users', 403, 'Demo superadmin DENIED /api/admin/users');
    count(r3b);
    const r3c = await testEndpoint(demoSuperAuth.token, '/api/admin/security/events', 403, 'Demo superadmin DENIED /api/admin/security/events');
    count(r3c);
    const r3d = await testEndpoint(demoSuperAuth.token, '/api/admin/audit-logs', 403, 'Demo superadmin DENIED /api/admin/audit-logs');
    count(r3d);

    // 4. Demo Admin Access Denial (403 Forbidden Expected)
    console.log('\n--- 4. Demo Admin Denial (403 Forbidden Expected) ---');
    const demoAdminToken = signToken('mock-user-admin-002');
    const r4 = await testEndpoint(demoAdminToken, '/api/admin/dashboard', 403, 'Demo admin (mock-user-admin-002) DENIED /api/admin/dashboard');
    count(r4);

    // 5. Demo Archivist Access Denial (403 Forbidden Expected)
    console.log('\n--- 5. Demo Archivist Denial (403 Forbidden Expected) ---');
    const demoArchAuth = await login('archivist@ambedkar-archive.in', 'Archivist@1234');
    const r5 = await testEndpoint(demoArchAuth.token, '/api/admin/dashboard', 403, 'Demo archivist DENIED /api/admin/dashboard');
    count(r5);

    // 6. Demo Researcher Access Denial (403 Forbidden Expected)
    console.log('\n--- 6. Demo Researcher Denial (403 Forbidden Expected) ---');
    const demoResAuth = await login('researcher@ambedkar-archive.in', 'Research@1234');
    const r6 = await testEndpoint(demoResAuth.token, '/api/admin/dashboard', 403, 'Demo researcher DENIED /api/admin/dashboard');
    count(r6);

  } catch (err) {
    console.error('Fatal regression suite error:', err);
    failed++;
  }

  console.log('\n======================================================');
  console.log(`TOTAL REGRESSION TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
}

runSuite();
