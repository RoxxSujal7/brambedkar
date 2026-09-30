const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const testFiles = [
  'about-page.test.js',
  'admin-cms.test.js',
  'admin-enterprise.test.js',
  'content-expansion-audit.test.js',
  'hybrid-search.test.js',
  'institutional-audit.test.js',
  'navigation-system.test.js',
  'otp-auth.test.js',
  'otp-external-devices.test.js',
  'password-security.test.js',
  'rbac-authorization.test.js',
  'research-workspace.test.js',
  'security-regression.test.js',
  'security-remediation-suite.test.js',
  'sha256-integrity.test.js',
  'theme-font-contrast.test.js',
  'real-user-login-intelligence.test.js',
  'test-data-isolation-and-classification.test.js',
];

console.log('========================================================');
console.log('🧪 RUNNING COMPLETE TEST PORTFOLIO (BASELINE + REAL LOGIN)');
console.log('========================================================\n');

let totalPassed = 0;
let totalFailed = 0;
const results = [];

for (const file of testFiles) {
  const filePath = path.join(__dirname, file);
  process.stdout.write(`▶ Running ${file.padEnd(38)} ... `);
  try {
    const output = execSync(`node "${filePath}"`, {
      encoding: 'utf8',
      timeout: 60000,
      env: { ...process.env, NODE_ENV: 'test', TEST_MODE: 'true', TEST_BASE_URL: 'http://127.0.0.1:5000' },
    });

    // Robust summary regex handling all archive test formats
    const summaryMatch = output.match(/(?:PASSED[:\s]+(\d+)[^0-9\r\n]+FAILED[:\s]+(\d+))|(?:(\d+)\s+PASSED[^0-9\r\n]+(\d+)\s+FAILED)/i);
    let passCount = 0;
    let failCount = 0;

    if (summaryMatch) {
      passCount = parseInt(summaryMatch[1] || summaryMatch[3], 10);
      failCount = parseInt(summaryMatch[2] || summaryMatch[4], 10);
    } else {
      const explicitFails = (output.match(/✗\s*FAIL|❌\s*FAIL/gi) || []).length;
      const explicitPasses = (output.match(/✓\s*PASS|✅\s*PASS/gi) || []).length;
      failCount = explicitFails;
      passCount = explicitPasses > 0 ? explicitPasses : (output.match(/PASS/gi) || []).length;
    }

    totalPassed += passCount;
    totalFailed += failCount;
    results.push({ file, pass: passCount, fail: failCount, ok: failCount === 0 });
    console.log(`✅ ${passCount} passed${failCount > 0 ? `, ❌ ${failCount} failed` : ''}`);
  } catch (err) {
    const stdout = err.stdout ? err.stdout.toString() : '';
    const passMatches = stdout.match(/PASS/g) || [];
    const failMatches = stdout.match(/FAIL/g) || [];
    totalPassed += passMatches.length;
    totalFailed += Math.max(failMatches.length, 1);
    results.push({ file, pass: passMatches.length, fail: Math.max(failMatches.length, 1), ok: false });
    console.log(`❌ FAILED (${err.message})`);
  }
}

console.log('\n========================================================');
console.log('📊 FINAL TEST PORTFOLIO SUMMARY');
console.log('========================================================');
results.forEach(r => {
  console.log(`  ${r.ok ? '✅' : '❌'} ${r.file.padEnd(38)}: ${r.pass} Passed, ${r.fail} Failed`);
});
console.log('--------------------------------------------------------');
console.log(`TOTAL PORTFOLIO SCORE: ${totalPassed} PASSED, ${totalFailed} FAILED`);
console.log('========================================================\n');

if (totalFailed > 0) process.exit(1);
