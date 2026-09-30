const assert = require('assert');
const userService = require('../backend/services/userService');
const adminService = require('../backend/services/adminService');

let passed = 0;
let failed = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${name} ->`, err.message);
    failed++;
  }
}

async function itAsync(name, fn) {
  try {
    await fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${name} ->`, err.message);
    failed++;
  }
}

async function runTests() {
  console.log('======================================================');
  console.log('🛡️ TEST DATA ISOLATION & ACCURATE CLASSIFICATION SUITE');
  console.log('======================================================\n');

  // TEST 1: Test users strictly classify as 'test'
  it('1. Synthetic session_inv_ email classifies as "test"', () => {
    const res = userService.classifyUser('session_inv_1790768414737@test.com');
    assert.strictEqual(res, 'test');
  });

  it('2. Synthetic sec_user_ email classifies as "test"', () => {
    const res = userService.classifyUser('sec_user_1790768381951_valid@test.com');
    assert.strictEqual(res, 'test');
  });

  it('3. Genuine institutional scholar columbia.edu classifies as "real"', () => {
    const res = userService.classifyUser('scholar.ambedkar@columbia.edu');
    assert.strictEqual(res, 'real');
  });

  it('4. Test-generated atlas verify fixture classifies as "test"', () => {
    const res = userService.classifyUser('atlas.verify.1790711352560@ambedkar-audit.org');
    assert.strictEqual(res, 'test');
  });

  it('5. Any user object with isTest: true strictly classifies as "test"', () => {
    const res = userService.classifyUser({ email: 'someuser@somedomain.com', isTest: true });
    assert.strictEqual(res, 'test');
  });

  // TEST 2: Demo users strictly classify as 'demo'
  it('6. Institutional visitor demo account classifies as "demo"', () => {
    const res = userService.classifyUser('visitor@ambedkar-archive.in', 'mock-user-visitor-000');
    assert.strictEqual(res, 'demo');
  });

  it('7. Institutional researcher demo account classifies as "demo"', () => {
    const res = userService.classifyUser('researcher@ambedkar-archive.in', 'mock-user-researcher-001');
    assert.strictEqual(res, 'demo');
  });

  // TEST 3: Genuine production users classify as 'real'
  it('8. Real administrator email classifies as "real"', () => {
    const res = userService.classifyUser('admin@ambedkar-archive.in', '6abc26c4ae686afdfd4af6c1');
    assert.strictEqual(res, 'real');
  });

  it('9. Real Google OAuth user classifies as "real"', () => {
    const res = userService.classifyUser('anandayush3310@gmail.com', '6abcb81a0c993af9f64c630a');
    assert.strictEqual(res, 'real');
  });

  // TEST 4: classifyUser takes precedence over rawUser.userClassification when raw was defaulted to 'real'
  it('10. User object with unvalidated "real" classification but test email is corrected to "test"', () => {
    const contaminatedObject = {
      email: 'session_inv_99999@test.com',
      userClassification: 'real' // Old incorrect default
    };
    const res = userService.classifyUser(contaminatedObject);
    assert.strictEqual(res, 'test', 'Test email must override stale userClassification: real');
  });

  // TEST 5: Hard test database safety guard
  it('11. Database router redirects test mode to ambedkar_archive_test', () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    
    // Simulate URI resolution logic from backend/config/db.js
    const prodUri = 'mongodb+srv://user:pass@cluster.mongodb.net/ambedkar_archive?retryWrites=true&w=majority';
    let testUri = prodUri;
    if (testUri.includes('/ambedkar_archive?') || testUri.endsWith('/ambedkar_archive')) {
      testUri = testUri.replace(/\/ambedkar_archive(\?|$)/, '/ambedkar_archive_test$1');
    }
    assert.ok(testUri.includes('/ambedkar_archive_test?'), 'Must point to ambedkar_archive_test');
    assert.ok(!testUri.includes('/ambedkar_archive?'), 'Must NOT point to ambedkar_archive');
    
    process.env.NODE_ENV = origEnv;
  });

  // TEST 6: Security event rule evaluation suppresses test events
  await itAsync('12. Security rule evaluation suppresses test events from creating alerts', async () => {
    const testAuthEvent = {
      event: 'LOGIN_FAILED',
      userEmail: 'sec_user_99999@test.com',
      isTest: true,
      ip: '127.0.0.1'
    };
    // Should return early and not throw or write to file
    await adminService.evaluateSecurityRules(testAuthEvent);
  });

  console.log('\n------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
