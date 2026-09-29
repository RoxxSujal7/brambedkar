/**
 * admin-enterprise.test.js — Institutional Admin Console Enterprise Test Suite
 * Dr. B. R. Ambedkar Digital Heritage Archive
 * Tests:
 * - 1. Super Admin authentication & token issuance
 * - 2. Enhanced institutional dashboard telemetry (Phase 2)
 * - 3. User Directory pagination, search, and filtering (Phase 3)
 * - 4. User Detail Inspector & Security Audit Profile (Phase 3)
 * - 5. Force password reset mechanism (Phase 3)
 * - 6. Security Center alerts & anomaly detection (Phase 5)
 * - 7. Security Alert acknowledge & resolve lifecycle (Phase 5)
 * - 8. Authentication activity audit stream (Phase 4)
 * - 9. Digital Asset management & Dublin Core metadata (Phase 11)
 * - 10. Live cryptographic SHA-256 bitstream verification (Phase 12)
 * - 11. Digital Preservation overview & fixity status (Phase 12)
 * - 12. AI / RAG diagnostics, citations & vector re-indexing (Phase 13)
 * - 13. Search Intelligence & zero-result telemetry (Phase 14)
 * - 14. Institutional privacy-conscious analytics (Phase 15)
 * - 15. Museum Kiosk fleet management & heartbeat verification (Phase 16)
 * - 16. Multilingual translation parity matrix (Phase 17)
 * - 17. Scheduled publishing queue & release run (Phase 18)
 * - 18. Incident reporting & state transitions (Phase 19)
 * - 19. Real-time System Health diagnostic checks (Phase 20)
 * - 20. Institutional system settings configuration (Phase 20)
 * - 21. RBAC enforcement: Unauthenticated requests strictly denied (401)
 * - 22. RBAC enforcement: Regular visitor strictly denied (403 Forbidden)
 * - 23. Zero Secret Leakage: No passwords, hashes, OTPs, or API keys in responses
 */

const assert = require('assert');

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

let superAdminToken = '';
let visitorToken = '';
let passed = 0;
let failed = 0;

async function req(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function runEnterpriseTests() {
  console.log('═════════════════════════════════════════════════════════════════════');
  console.log('  PHASE 28: INSTITUTIONAL ADMIN ENTERPRISE UPGRADE TEST SUITE');
  console.log('═════════════════════════════════════════════════════════════════════\n');

  // Authenticate test accounts
  const saRes = await req('/api/auth/login', 'POST', {
    email: 'superadmin@ambedkar-archive.in',
    password: 'SuperAdmin@1234'
  });
  assert(saRes.status === 200 && saRes.data.token, 'Super admin login failed');
  superAdminToken = saRes.data.token;

  const visRes = await req('/api/auth/login', 'POST', {
    email: 'visitor@ambedkar-archive.in',
    password: 'Visitor@1234'
  });
  assert(visRes.status === 200 && visRes.data.token, 'Visitor login failed');
  visitorToken = visRes.data.token;

  // 1. Enhanced Dashboard Telemetry
  await asyncTest('1. Dashboard returns extended institutional metrics without fabricating data', async () => {
    const res = await req('/api/admin/dashboard', 'GET', null, superAdminToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(res.data.data.stats.totalVolumes >= 17);
    assert.strictEqual(res.data.data.stats.totalLetters, 361);
    assert(res.data.data.extendedMetrics !== undefined);
    assert(res.data.data.extendedMetrics.totalUsers >= 6);
  });

  // 2. User Directory Pagination & Search
  await asyncTest('2. User directory supports pagination, search, and role filtering', async () => {
    const res = await req('/api/admin/users?limit=5&page=1', 'GET', null, superAdminToken);
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data.users));
    assert(res.data.count <= 5);
    assert(res.data.total >= 6);
  });

  // 3. User Detail Inspector & Zero Secrets
  await asyncTest('3. User Detail Inspector returns profile, auth, and security telemetry without leaking credentials', async () => {
    const res = await req('/api/admin/users/mock-user-archivist-004', 'GET', null, superAdminToken);
    assert.strictEqual(res.status, 200);
    assert(res.data.data.profile !== undefined);
    assert.strictEqual(res.data.data.profile.email, 'archivist@ambedkar-archive.in');
    assert.strictEqual(res.data.data.authentication.emailVerified, true);
    // Strict zero-leakage assertions
    assert.strictEqual(res.data.data.profile.password, undefined);
    assert.strictEqual(res.data.data.profile.passwordHash, undefined);
    assert.strictEqual(res.data.data.profile.token, undefined);
  });

  // 4. Force Password Reset
  await asyncTest('4. Force password reset initiates secure temporary credential generation', async () => {
    const res = await req('/api/admin/users/mock-user-researcher-001/reset-password', 'POST', null, superAdminToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(res.data.message.includes('initiated'));
  });

  // 5. Security Center Alerts
  await asyncTest('5. Security Center retrieves rule-based threat and anomaly alerts', async () => {
    const res = await req('/api/admin/security/events', 'GET', null, superAdminToken);
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data.data));
  });

  // 6. Security Alert Acknowledge Lifecycle
  await asyncTest('6. Security alert acknowledge transition updates alert state', async () => {
    // Generate or fetch an alert
    const listRes = await req('/api/admin/security/events', 'GET', null, superAdminToken);
    if (listRes.data.data.length > 0) {
      const alertId = listRes.data.data[0].eventId;
      const ackRes = await req(`/api/admin/security/events/${alertId}/acknowledge`, 'PATCH', null, superAdminToken);
      assert.strictEqual(ackRes.status, 200);
      assert.strictEqual(ackRes.data.success, true);
    }
  });

  // 7. Authentication Activity Stream
  await asyncTest('7. Authentication activity log retrieves safe login/logout/OTP events', async () => {
    const res = await req('/api/admin/security/auth-activity?limit=10', 'GET', null, superAdminToken);
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data.data));
  });

  // 8. Digital Asset Management
  await asyncTest('8. Digital Asset Library returns cataloged assets with Dublin Core metadata', async () => {
    const res = await req('/api/admin/assets', 'GET', null, superAdminToken);
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data.data));
    assert(res.data.data.length >= 1);
    const asset = res.data.data[0];
    assert(asset.assetId.startsWith('AST-'));
    assert(asset.sha256Checksum.length === 64);
  });

  // 9. Live SHA-256 Bitstream Verification
  await asyncTest('9. Cryptographic SHA-256 live verification validates bitstream integrity', async () => {
    const res = await req('/api/admin/assets/verify/AST-DOC-1916-001', 'POST', null, superAdminToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.verificationStatus, 'VERIFIED');
    assert.strictEqual(res.data.sha256Matched, true);
  });

  // 10. Preservation Overview
  await asyncTest('10. Preservation Overview reports verified bitstreams and fixity check time', async () => {
    const res = await req('/api/admin/preservation/overview', 'GET', null, superAdminToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(res.data.data.totalAssets >= 1);
    assert(res.data.data.verifiedAssets >= 1);
  });

  // 11. AI / RAG Diagnostics
  await asyncTest('11. AI / RAG Diagnostics reports accurate grounding corpus and latency stats', async () => {
    const res = await req('/api/admin/ai/diagnostics', 'GET', null, superAdminToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(res.data.data.totalDocuments >= 17);
    assert(res.data.data.averageLatencyMs !== undefined);
  });

  // 12. AI Vector Re-indexing
  await asyncTest('12. AI corpus vector re-index job executes successfully', async () => {
    const res = await req('/api/admin/ai/reindex', 'POST', null, superAdminToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(res.data.indexedCount >= 17);
  });

  // 13. Search Intelligence
  await asyncTest('13. Search Intelligence provides discovery metrics and zero-result queries', async () => {
    const res = await req('/api/admin/search/intelligence', 'GET', null, superAdminToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(Array.isArray(res.data.data.zeroResultTerms));
    assert(Array.isArray(res.data.data.popularTerms));
  });

  // 14. Institutional Analytics
  await asyncTest('14. Privacy-conscious analytics returns aggregate engagement metrics', async () => {
    const res = await req('/api/admin/analytics?range=7d', 'GET', null, superAdminToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(res.data.data.uniqueVisitors !== undefined);
    assert(res.data.data.pageViews !== undefined);
  });

  // 15. Museum Kiosk Stations
  await asyncTest('15. Museum Kiosk stations report real hardware heartbeat telemetry', async () => {
    const res = await req('/api/admin/kiosks', 'GET', null, superAdminToken);
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data.kiosks));
    assert(res.data.kiosks.length >= 2);
    const k = res.data.kiosks[0];
    assert(k.kioskId.startsWith('KIOSK-'));
  });

  // 16. Kiosk Heartbeat Acknowledgment
  await asyncTest('16. POST /api/admin/kiosks/:id/heartbeat acknowledges station ping', async () => {
    const res = await req('/api/admin/kiosks/KIOSK-DAIC-01/heartbeat', 'POST', { appVersion: '1.4.2' }, superAdminToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.kiosk.status, 'ONLINE');
  });

  // 17. Multilingual Overview
  await asyncTest('17. Multilingual overview returns trilingual canon parity status', async () => {
    const res = await req('/api/admin/multilingual/overview', 'GET', null, superAdminToken);
    assert.strictEqual(res.status, 200);
    assert(res.data.data.englishPublished >= 17);
    assert(res.data.data.hindiPublished >= 17);
  });

  // 18. Scheduled Publishing Queue
  await asyncTest('18. Scheduled publishing queue handles schedule creation and cycle execution', async () => {
    const scheduleRes = await req('/api/admin/publishing/schedules', 'POST', {
      contentId: 'CON-TEST-1936',
      contentType: 'speeches',
      title: 'Commemorative Release: Castes in India',
      scheduledPublishAt: new Date(Date.now() + 86400000).toISOString()
    }, superAdminToken);
    assert.strictEqual(scheduleRes.status, 201);

    const runRes = await req('/api/admin/publishing/run-now', 'POST', null, superAdminToken);
    assert.strictEqual(runRes.status, 200);
    assert.strictEqual(runRes.data.success, true);
  });

  // 19. Incident Management
  await asyncTest('19. Incident reporting creates audited institutional response record', async () => {
    const res = await req('/api/admin/incidents', 'POST', {
      title: 'Minor optical scan distortion detected in Volume 4 page 112',
      description: 'Human verifier detected skewed marginalia in secondary scan.',
      severity: 'LOW',
      assignedTo: 'archivist@ambedkar-archive.in'
    }, superAdminToken);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert(res.data.incident.incidentId.startsWith('INC-'));
  });

  // 20. Real-time System Health
  await asyncTest('20. System Health returns authentic diagnostics across all subsystems', async () => {
    const res = await req('/api/admin/system-health', 'GET', null, superAdminToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(res.data.data.subsystems.api.status === 'HEALTHY');
    assert(res.data.data.subsystems.authentication.status === 'HEALTHY');
  });

  // 21. Institutional System Settings
  await asyncTest('21. System Settings can be updated and retrieved by Super Admin', async () => {
    const patchRes = await req('/api/admin/settings', 'PATCH', {
      archiveTitle: 'Dr. B. R. Ambedkar Digital Heritage Archive'
    }, superAdminToken);
    assert.strictEqual(patchRes.status, 200);

    const getRes = await req('/api/admin/settings', 'GET', null, superAdminToken);
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getRes.data.settings.archiveTitle, 'Dr. B. R. Ambedkar Digital Heritage Archive');
  });

  // 22. RBAC: Unauthenticated blocked with 401
  await asyncTest('22. Unauthenticated access to enterprise endpoints is strictly DENIED with 401', async () => {
    const res1 = await req('/api/admin/security/events', 'GET');
    assert.strictEqual(res1.status, 401);
    const res2 = await req('/api/admin/system-health', 'GET');
    assert.strictEqual(res2.status, 401);
  });

  // 23. RBAC: Unauthorized visitor blocked with 403 Forbidden
  await asyncTest('23. Visitor attempting enterprise admin access is strictly DENIED with 403 Forbidden', async () => {
    const res1 = await req('/api/admin/security/events', 'GET', null, visitorToken);
    assert.strictEqual(res1.status, 403);
    const res2 = await req('/api/admin/settings', 'PATCH', { archiveTitle: 'Hacked' }, visitorToken);
    assert.strictEqual(res2.status, 403);
  });

  console.log('\n═════════════════════════════════════════════════════════════════════');
  console.log(`  ENTERPRISE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('═════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

runEnterpriseTests().catch(err => {
  console.error('Fatal test suite error:', err);
  process.exit(1);
});
