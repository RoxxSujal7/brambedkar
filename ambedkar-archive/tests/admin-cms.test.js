/**
 * admin-cms.test.js — Phase 2 Institutional Admin CMS & Security Test Suite
 * Tests:
 * - 2.1 Admin Authentication & Server-Side RBAC (all roles)
 * - 2.2 Secure Admin Dashboard metrics & statistics
 * - 2.3 Archive Content Management (CRUD, Soft Delete, Restore, Version History)
 * - 2.4 Document Upload & Secure Ingestion Pipeline (MIME, magic byte, size, SHA-256)
 * - 2.5 Metadata Management (Dublin Core, MODS, PREMIS)
 * - 2.6 OCR Review Workflow & Confidence Analysis
 * - 2.7 Application Audit Log (integrity, filtering, zero secret leaks)
 * - 2.8 User & Role Governance (privilege escalation prevention)
 */

const assert = require('assert');

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

let superAdminToken = '';
let adminToken = '';
let archivistToken = '';
let editorToken = '';
let researcherToken = '';
let visitorToken = '';

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!data.token) throw new Error(`Login failed for ${email}: ${data.message || 'no token'}`);
  return data.token;
}

let passed = 0;
let failed = 0;

async function test(name, fn) {
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

async function runPhase2Tests() {
  console.log('═════════════════════════════════════════════════════════════════════');
  console.log('  PHASE 2: INSTITUTIONAL ADMIN CMS & RBAC GOVERNANCE TEST SUITE');
  console.log('═════════════════════════════════════════════════════════════════════\n');

  // Authenticate test accounts
  superAdminToken = await login('superadmin@ambedkar-archive.in', 'SuperAdmin@1234');
  adminToken = await login('admin@ambedkar-archive.in', 'Admin@1234');
  archivistToken = await login('archivist@ambedkar-archive.in', 'Archivist@1234');
  editorToken = await login('editor@ambedkar-archive.in', 'Editor@1234');
  researcherToken = await login('researcher@ambedkar-archive.in', 'Research@1234');
  visitorToken = await login('visitor@ambedkar-archive.in', 'Visitor@1234');

  // 1. Authentication & RBAC Gate
  await test('1.1 Unauthenticated requests to /api/admin/dashboard receive 401', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/dashboard`);
    assert.strictEqual(res.status, 401);
  });

  await test('1.2 Public visitor receives 403 Forbidden on /api/admin/dashboard', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${visitorToken}` }
    });
    assert.strictEqual(res.status, 403);
  });

  await test('1.3 Archival Researcher receives 403 Forbidden on /api/admin/dashboard', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${researcherToken}` }
    });
    assert.strictEqual(res.status, 403);
  });

  // 2. Real System Metrics on Dashboard
  await test('2.1 Authorized Archivist receives live institutional metrics on /api/admin/dashboard', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${archivistToken}` }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.stats.totalVolumes >= 17);
    assert.strictEqual(json.data.stats.totalLetters, 361);
    assert.strictEqual(json.data.stats.totalMemorials, 8);
    assert.strictEqual(json.data.stats.totalDebates, 6);
    assert.strictEqual(json.data.stats.preservationStatus, 'VERIFIED_HEALTHY');
    assert.ok(Array.isArray(json.data.recentAuditLog));
  });

  // 3. Content Management (CRUD, Soft Delete, Restore)
  let createdRecordId = '';
  await test('3.1 Content Editor creates a new debate commentary record (POST /api/admin/content/debates)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/content/debates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${editorToken}`
      },
      body: JSON.stringify({
        title: 'Archival Commentary on 1932 Poona Deliberations',
        summary: 'Scholarly overview of joint electorates with reserved seats.',
        category: 'electoral-representation',
        bawsVolumeNo: 9,
        contentText: 'Historical analysis of the settlement between Dr. Ambedkar and M. K. Gandhi.'
      })
    });
    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.record.id);
    assert.strictEqual(json.record.version, 1);
    assert.strictEqual(json.record.isArchived, false);
    createdRecordId = json.record.id;
  });

  await test('3.2 Content Editor updates the created record (PUT /api/admin/content/debates/:id)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/content/debates/${createdRecordId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${editorToken}`
      },
      body: JSON.stringify({
        summary: 'Updated scholarly overview with verified BAWS Vol. 9 citations.',
        status: 'reviewed'
      })
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.record.version, 2);
    assert.ok(json.record.versionHistory.length >= 2);
  });

  await test('3.3 Soft-delete / Archive record (PATCH /api/admin/content/debates/:id/archive)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/content/debates/${createdRecordId}/archive`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${editorToken}` }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.record.isArchived, true);
    assert.strictEqual(json.record.status, 'archived');
  });

  await test('3.4 Restore soft-deleted record (PATCH /api/admin/content/debates/:id/restore)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/content/debates/${createdRecordId}/restore`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${editorToken}` }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.record.isArchived, false);
    assert.strictEqual(json.record.status, 'active');
  });

  // 4. Secure Document Ingestion Pipeline
  await test('4.1 Rejects upload with forbidden executable extension (.exe)', async () => {
    const fakeBase64 = Buffer.from('executable binary simulation').toString('base64');
    const res = await fetch(`${BASE_URL}/api/admin/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${archivistToken}`
      },
      body: JSON.stringify({
        filename: 'malicious_script.exe',
        mimeType: 'application/pdf',
        fileDataBase64: fakeBase64,
        title: 'Exploit Attempt'
      })
    });
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.ok(json.message.includes('strictly forbidden'));
  });

  await test('4.2 Rejects upload with spoofed MIME type (text file declared as PDF without %PDF signature)', async () => {
    const plainTextBase64 = Buffer.from('Hello world this is not a real PDF document').toString('base64');
    const res = await fetch(`${BASE_URL}/api/admin/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${archivistToken}`
      },
      body: JSON.stringify({
        filename: 'spoofed_document.pdf',
        mimeType: 'application/pdf',
        fileDataBase64: plainTextBase64,
        title: 'Spoofed PDF Document'
      })
    });
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.ok(json.message.includes('binary signature does not match'));
  });

  await test('4.3 Accepts authentic PDF with valid %PDF- magic-byte signature and computes SHA-256 digest', async () => {
    // Valid PDF signature buffer: "%PDF-1.4 ... %%EOF"
    const validPdfBuffer = Buffer.concat([
      Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF'),
      Buffer.alloc(100, 0x20)
    ]);
    const pdfBase64 = validPdfBuffer.toString('base64');

    const res = await fetch(`${BASE_URL}/api/admin/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${archivistToken}`
      },
      body: JSON.stringify({
        filename: 'Ambedkar_Address_1942.pdf',
        mimeType: 'application/pdf',
        fileDataBase64: pdfBase64,
        title: 'Dr. Ambedkar Address to All-India Depressed Classes Conference (1942)',
        category: 'speeches',
        volumeNo: 10
      })
    });

    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.sha256Checksum);
    assert.strictEqual(json.data.sha256Checksum.length, 64);
    assert.strictEqual(json.data.checksumAlgorithm, 'SHA-256');
    assert.strictEqual(json.data.dublinCore.format, 'application/pdf');
  });

  // 5. Metadata Management (Dublin Core / PREMIS)
  await test('5.1 Metadata curation endpoint updates Dublin Core fields', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/documents/DOC-PREMIS-01/metadata`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${archivistToken}`
      },
      body: JSON.stringify({
        title: 'Round Table Conference Proceedings',
        creator: 'Dr. B. R. Ambedkar',
        date: '1931-11-20',
        language: 'en',
        subject: ['Constitutional Rights', 'Minority Safeguards', 'Franchise'],
        rights: 'Public Domain Educational Resource',
        sourceInstitution: 'Dr. Ambedkar International Centre',
        relatedBawsVolume: 2
      })
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.updatedMetadata.language, 'en');
    assert.ok(json.updatedMetadata.subject.includes('Minority Safeguards'));
  });

  // 6. OCR Review Workflow & Confidence Analysis
  await test('6.1 OCR Queue returns pending jobs with confidence analysis', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/ocr/queue`, {
      headers: { Authorization: `Bearer ${archivistToken}` }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data));
    assert.ok(json.data.length >= 2);
    const job = json.data[0];
    assert.ok(typeof job.overallConfidence === 'number');
    assert.ok(Array.isArray(job.flaggedWords));
  });

  await test('6.2 Archivist signs off on corrected OCR transcription (PATCH /api/admin/ocr/review/:id)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/ocr/review/OCR-JOB-101`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${archivistToken}`
      },
      body: JSON.stringify({
        correctedText: 'The freedom of trade and commerce throughout the territory of India shall be secure.',
        status: 'REVIEWED_APPROVED'
      })
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.job.status, 'REVIEWED_APPROVED');
    assert.ok(json.job.correctedTranscription.includes('throughout the territory'));
  });

  // 7. Audit Log System
  await test('7.1 Audit log records administrative operations without leaking credentials', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/audit-log`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.count >= 5);
    // Verify none of the log items contain plaintext password
    json.data.forEach(item => {
      assert.strictEqual(item.details.includes('SuperAdmin@1234'), false);
      assert.strictEqual(item.details.includes('Admin@1234'), false);
      assert.ok(item.action);
      assert.ok(item.actor);
      assert.ok(item.timestamp);
    });
  });

  // 8. User & Role Governance & Privilege Escalation Prevention
  await test('8.1 Admin user cannot escalate their own role or promote someone to super_admin (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users/user-001/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        role: 'super_admin',
        currentTargetRole: 'researcher'
      })
    });
    assert.strictEqual(res.status, 403);
    const json = await res.json();
    assert.ok(json.message.includes('cannot assign or modify role'));
  });

  await test('8.2 Admin user cannot demote or modify super_admin (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users/user-005/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        role: 'visitor',
        currentTargetRole: 'super_admin'
      })
    });
    assert.strictEqual(res.status, 403);
  });

  await test('8.3 Super Admin CAN assign archivist role to researcher', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users/user-001/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        role: 'archivist',
        currentTargetRole: 'researcher'
      })
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.newRole, 'archivist');

    // Cleanup: restore user-001 back to researcher
    await fetch(`${BASE_URL}/api/admin/users/user-001/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        role: 'researcher',
        currentTargetRole: 'archivist'
      })
    });
  });

  console.log('\n═════════════════════════════════════════════════════════════════════');
  console.log(`  PHASE 2 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('═════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

runPhase2Tests().catch(err => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
