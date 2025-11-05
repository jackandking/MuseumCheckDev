// Simple Node.js validation test for Forbidden City independent data file
// Run: node tests/forbidden-city-data-validation.js

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Forbidden City Independent Data File\n');

// Load museums-data.js
const museumsDataPath = path.join(__dirname, '..', 'museums-data.js');
const museumsDataContent = fs.readFileSync(museumsDataPath, 'utf8');

// Load forbidden-city.js
const forbiddenCityPath = path.join(__dirname, '..', 'museums/forbidden-city.js');
const forbiddenCityContent = fs.readFileSync(forbiddenCityPath, 'utf8');

// Simulate browser environment
// Note: eval() is used here safely in test context to execute data files
// These are trusted internal data files, not user input
const window = {};
eval(museumsDataContent);
eval(forbiddenCityContent);

let passed = 0;
let failed = 0;

function test(name, condition) {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    failed++;
  }
}

// Test 1: Basic data loaded
test('MUSEUMS array loaded', Array.isArray(window.MUSEUMS));
test('MUSEUM_FORBIDDEN_CITY object loaded', !!window.MUSEUM_FORBIDDEN_CITY);

// Test 2: Basic properties
test('Forbidden City has correct ID', window.MUSEUM_FORBIDDEN_CITY?.id === 'forbidden-city');
test('Forbidden City has correct name', window.MUSEUM_FORBIDDEN_CITY?.name === '故宫博物院');
test('Forbidden City has location', window.MUSEUM_FORBIDDEN_CITY?.location === '北京');
test('Forbidden City has description', !!window.MUSEUM_FORBIDDEN_CITY?.description);
test('Forbidden City has tags', Array.isArray(window.MUSEUM_FORBIDDEN_CITY?.tags));
test('Forbidden City has image URL', !!window.MUSEUM_FORBIDDEN_CITY?.image);

// Test 3: Collections (three treasures)
test('Has collections array', Array.isArray(window.MUSEUM_FORBIDDEN_CITY?.collections));
test('Has exactly 3 collections', window.MUSEUM_FORBIDDEN_CITY?.collections?.length === 3);

if (window.MUSEUM_FORBIDDEN_CITY?.collections) {
  const treasureNames = window.MUSEUM_FORBIDDEN_CITY.collections.map(c => c.name);
  test('Has 清明上河图', treasureNames.includes('《清明上河图》'));
  test('Has 金瓯永固杯', treasureNames.includes('金瓯永固杯'));
  test('Has 酗亚方尊', treasureNames.includes('酗亚方尊'));
  
  test('All collections have name', window.MUSEUM_FORBIDDEN_CITY.collections.every(c => !!c.name));
  test('All collections have URL', window.MUSEUM_FORBIDDEN_CITY.collections.every(c => !!c.url));
  test('All collections have description', window.MUSEUM_FORBIDDEN_CITY.collections.every(c => !!c.description));
}

// Test 4: Workflows
test('Has workflows array', Array.isArray(window.MUSEUM_FORBIDDEN_CITY?.workflows));
test('Has exactly 2 workflows', window.MUSEUM_FORBIDDEN_CITY?.workflows?.length === 2);

if (window.MUSEUM_FORBIDDEN_CITY?.workflows) {
  const workflow1 = window.MUSEUM_FORBIDDEN_CITY.workflows[0];
  const workflow2 = window.MUSEUM_FORBIDDEN_CITY.workflows[1];
  
  test('Workflow 1: has ID', !!workflow1?.id);
  test('Workflow 1: has name', !!workflow1?.name);
  test('Workflow 1: has description', !!workflow1?.description);
  test('Workflow 1: has ages', Array.isArray(workflow1?.ages));
  test('Workflow 1: has tasks', Array.isArray(workflow1?.tasks));
  test('Workflow 1: has 6 tasks', workflow1?.tasks?.length === 6);
  
  test('Workflow 2: has ID', !!workflow2?.id);
  test('Workflow 2: has name', !!workflow2?.name);
  test('Workflow 2: has description', !!workflow2?.description);
  test('Workflow 2: has ages', Array.isArray(workflow2?.ages));
  test('Workflow 2: has tasks', Array.isArray(workflow2?.tasks));
  test('Workflow 2: has 5 tasks', workflow2?.tasks?.length === 5);
}

// Test 5: Checklists
test('Has checklists object', !!window.MUSEUM_FORBIDDEN_CITY?.checklists);
test('Has parent checklists', !!window.MUSEUM_FORBIDDEN_CITY?.checklists?.parent);
test('Has child checklists', !!window.MUSEUM_FORBIDDEN_CITY?.checklists?.child);

if (window.MUSEUM_FORBIDDEN_CITY?.checklists) {
  const parent = window.MUSEUM_FORBIDDEN_CITY.checklists.parent;
  const child = window.MUSEUM_FORBIDDEN_CITY.checklists.child;
  
  test('Parent 3-6: has items', Array.isArray(parent?.['3-6']) && parent['3-6'].length > 0);
  test('Parent 7-12: has items', Array.isArray(parent?.['7-12']) && parent['7-12'].length > 0);
  test('Parent 13-18: has items', Array.isArray(parent?.['13-18']) && parent['13-18'].length > 0);
  
  test('Child 3-6: has items', Array.isArray(child?.['3-6']) && child['3-6'].length > 0);
  test('Child 7-12: has items', Array.isArray(child?.['7-12']) && child['7-12'].length > 0);
  test('Child 13-18: has items', Array.isArray(child?.['13-18']) && child['13-18'].length > 0);
}

// Test 6: Data merge validation
// Simulate the merge process in single-museum.html
const overrides = [];
if (window.MUSEUM_FORBIDDEN_CITY) overrides.push(window.MUSEUM_FORBIDDEN_CITY);

overrides.forEach(function(m){
  if(!m || !m.id) return;
  var idx = window.MUSEUMS.findIndex(function(x){ return x && x.id===m.id; });
  if(idx>=0) window.MUSEUMS[idx] = Object.assign({}, window.MUSEUMS[idx], m);
});

const mergedMuseum = window.MUSEUMS.find(m => m.id === 'forbidden-city');
test('Museum merges correctly', !!mergedMuseum);
test('Merged museum has collections', Array.isArray(mergedMuseum?.collections));
test('Merged museum has workflows', Array.isArray(mergedMuseum?.workflows));

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('✅ All tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!');
  process.exit(1);
}
