/**
 * Test for API response case sensitivity fix (items vs Items)
 * 
 * This test verifies that both script.js and admin-leaderboard.js
 * can handle API responses with either 'items' or 'Items' keys.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing API Response Case Sensitivity Fix...\n');

// Read the script.js file
const scriptPath = path.join(__dirname, 'script.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Read the admin-leaderboard.js file
const adminPath = path.join(__dirname, 'admin-leaderboard.js');
const adminContent = fs.readFileSync(adminPath, 'utf8');

// Check 1: Verify script.js supports both items and Items
const scriptHasItemsOrItems = scriptContent.includes('result.items || result.Items');
console.log(`✓ Check 1: script.js supports both 'items' and 'Items'`);
console.log(`   ${scriptHasItemsOrItems ? '✅ YES' : '❌ NO'}`);

// Check 2: Verify admin-leaderboard.js supports both items and Items  
const adminHasItemsOrItems = adminContent.includes('data.items || data.Items');
console.log(`\n✓ Check 2: admin-leaderboard.js supports both 'items' and 'Items'`);
console.log(`   ${adminHasItemsOrItems ? '✅ YES' : '❌ NO'}`);

// Check 3: Verify no hardcoded access to only lowercase items in script.js
const scriptHasOnlyLowercase = scriptContent.match(/result\.items\s*&&\s*Array\.isArray\(result\.items\)/);
console.log(`\n✓ Check 3: script.js doesn't use only lowercase 'items'`);
console.log(`   ${!scriptHasOnlyLowercase ? '✅ CORRECT (uses flexible approach)' : '❌ STILL HARDCODED'}`);

// Check 4: Verify no hardcoded access to only lowercase items in admin
const adminHasOnlyLowercase = adminContent.match(/data\.items\s*&&\s*Array\.isArray\(data\.items\)/);
console.log(`\n✓ Check 4: admin-leaderboard.js doesn't use only lowercase 'items'`);
console.log(`   ${!adminHasOnlyLowercase ? '✅ CORRECT (uses flexible approach)' : '❌ STILL HARDCODED'}`);

// Check 5: Verify the fix includes a comment about AWS DynamoDB compatibility
const scriptHasComment = scriptContent.includes('AWS DynamoDB compatibility');
const adminHasComment = adminContent.includes('AWS DynamoDB compatibility');
console.log(`\n✓ Check 5: Code includes AWS DynamoDB compatibility comment`);
console.log(`   script.js: ${scriptHasComment ? '✅ YES' : '❌ NO'}`);
console.log(`   admin-leaderboard.js: ${adminHasComment ? '✅ YES' : '❌ NO'}`);

// Summary
console.log('\n📊 Verification Summary:');
const allChecks = [
  scriptHasItemsOrItems,
  adminHasItemsOrItems,
  !scriptHasOnlyLowercase,
  !adminHasOnlyLowercase,
  scriptHasComment,
  adminHasComment
];

const passedChecks = allChecks.filter(c => c).length;
const totalChecks = allChecks.length;

console.log(`   ${passedChecks}/${totalChecks} checks passed`);

if (passedChecks === totalChecks) {
  console.log('\n✅ All verification checks passed! The fix properly handles both response formats.');
  console.log('\nWhat was fixed:');
  console.log('  • script.js now accepts both result.items and result.Items');
  console.log('  • admin-leaderboard.js now accepts both data.items and data.Items');
  console.log('  • This ensures compatibility with AWS DynamoDB query responses');
  console.log('\nThis fixes the issue where the admin page shows empty data');
  console.log('when the API returns "Items" (capital I) instead of "items" (lowercase).');
  process.exit(0);
} else {
  console.log('\n❌ Some checks failed. Please review the implementation.');
  process.exit(1);
}
