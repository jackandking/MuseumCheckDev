/**
 * Verification script for leaderboard API parameter fix
 * 
 * This script verifies that:
 * 1. submitScore() uses expireAt parameter
 * 2. admin updateEntry() uses expireAt parameter
 * 3. No ttl parameters remain in the wrong places
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Leaderboard API Parameter Fix...\n');

// Read script.js
const scriptPath = path.join(__dirname, 'script.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Read admin-leaderboard.js
const adminPath = path.join(__dirname, 'admin-leaderboard.js');
const adminContent = fs.readFileSync(adminPath, 'utf8');

// Check 1: Verify script.js submitScore uses expireAt
const hasExpireAtInSubmit = scriptContent.includes('expireAt: REMOTE_STORAGE_CONFIG.TIMESTAMP_2124');
const hasTtlInSubmit = scriptContent.includes('ttl: REMOTE_STORAGE_CONFIG.TIMESTAMP_2124');

console.log(`✓ Check 1: script.js submitScore()`);
console.log(`   Uses expireAt: ${hasExpireAtInSubmit ? '✅ YES' : '❌ NO'}`);
console.log(`   Uses ttl: ${hasTtlInSubmit ? '❌ YES (BAD)' : '✅ NO (GOOD)'}`);

// Check 2: Verify admin-leaderboard.js updateEntry uses expireAt
const hasExpireAtInUpdate = adminContent.includes('expireAt: CONFIG.TIMESTAMP_2124');
const hasTtlInUpdate = adminContent.includes('ttl: CONFIG.TIMESTAMP_2124');

console.log(`\n✓ Check 2: admin-leaderboard.js updateEntry()`);
console.log(`   Uses expireAt: ${hasExpireAtInUpdate ? '✅ YES' : '❌ NO'}`);
console.log(`   Uses ttl: ${hasTtlInUpdate ? '❌ YES (BAD)' : '✅ NO (GOOD)'}`);

// Check 3: Verify deleteEntry already uses expireAt
const hasExpireAtInDelete = adminContent.includes('expireAt: expireAt');

console.log(`\n✓ Check 3: admin-leaderboard.js deleteEntry()`);
console.log(`   Uses expireAt: ${hasExpireAtInDelete ? '✅ YES' : '❌ NO'}`);

// Check 4: Verify updateKeyValueStore signature (should use expireAt)
const updateKeyValueStoreMatch = scriptContent.match(/async updateKeyValueStore\([^)]*expireAt[^)]*\)/);
const hasCorrectSignature = updateKeyValueStoreMatch !== null;

console.log(`\n✓ Check 4: updateKeyValueStore() signature`);
console.log(`   Has expireAt parameter: ${hasCorrectSignature ? '✅ YES' : '❌ NO'}`);

// Check 5: Look for any remaining ttl usage in API calls (should be none)
const ttlInScriptAPI = scriptContent.match(/body:\s*JSON\.stringify\([^)]*ttl:/);
const ttlInAdminAPI = adminContent.match(/body:\s*JSON\.stringify\([^)]*ttl:/);

console.log(`\n✓ Check 5: No remaining ttl in API calls`);
console.log(`   script.js has ttl in API: ${ttlInScriptAPI ? '❌ YES (BAD)' : '✅ NO (GOOD)'}`);
console.log(`   admin-leaderboard.js has ttl in API: ${ttlInAdminAPI ? '❌ YES (BAD)' : '✅ NO (GOOD)'}`);

// Summary
console.log('\n📊 Verification Summary:');
const allChecks = [
  hasExpireAtInSubmit,
  !hasTtlInSubmit,
  hasExpireAtInUpdate,
  !hasTtlInUpdate,
  hasExpireAtInDelete,
  hasCorrectSignature,
  !ttlInScriptAPI,
  !ttlInAdminAPI
];

const passedChecks = allChecks.filter(c => c).length;
const totalChecks = allChecks.length;

console.log(`   ${passedChecks}/${totalChecks} checks passed`);

if (passedChecks === totalChecks) {
  console.log('\n✅ All verification checks passed! The fix is properly implemented.');
  console.log('\nWhat was fixed:');
  console.log('  • script.js line 3447: Changed ttl to expireAt in submitScore()');
  console.log('  • admin-leaderboard.js line 69: Changed ttl to expireAt in updateEntry()');
  console.log('\nThis ensures leaderboard data is properly stored and visible in admin page.');
  process.exit(0);
} else {
  console.log('\n❌ Some checks failed. Please review the implementation.');
  
  if (!hasExpireAtInSubmit) console.log('  • FIX: script.js submitScore() should use expireAt');
  if (hasTtlInSubmit) console.log('  • FIX: script.js submitScore() should NOT use ttl');
  if (!hasExpireAtInUpdate) console.log('  • FIX: admin-leaderboard.js updateEntry() should use expireAt');
  if (hasTtlInUpdate) console.log('  • FIX: admin-leaderboard.js updateEntry() should NOT use ttl');
  if (ttlInScriptAPI) console.log('  • FIX: Remove ttl from API calls in script.js');
  if (ttlInAdminAPI) console.log('  • FIX: Remove ttl from API calls in admin-leaderboard.js');
  
  process.exit(1);
}
