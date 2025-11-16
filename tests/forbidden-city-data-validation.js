// Simple Node.js validation test for Forbidden City data
// Run: node tests/forbidden-city-data-validation.js

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Forbidden City Museum Data\n');

// Load museums-data.js
const museumsDataPath = path.join(__dirname, '..', 'museums-data.js');
const museumsDataContent = fs.readFileSync(museumsDataPath, 'utf8');

// Load workflows-data.js
const workflowsDataPath = path.join(__dirname, '..', 'workflows-data.js');
const workflowsDataContent = fs.readFileSync(workflowsDataPath, 'utf8');

// Load forbidden-city.json
const forbiddenCityJsonPath = path.join(__dirname, '..', 'museums/forbidden-city.json');
const forbiddenCityJson = JSON.parse(fs.readFileSync(forbiddenCityJsonPath, 'utf8'));

// Simulate browser environment
const window = {};
const global = {};
eval(museumsDataContent);
eval(workflowsDataContent);

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

// Get museum from MUSEUMS array
const forbiddenCity = global.MUSEUMS && global.MUSEUMS.find(m => m.id === 'forbidden-city');
const workflows = global.WORKFLOWS && global.WORKFLOWS['forbidden-city'];

// Test 1: Basic data loaded
test('MUSEUMS array loaded', Array.isArray(global.MUSEUMS));
test('Forbidden City museum loaded', !!forbiddenCity);
test('Forbidden City JSON file exists', !!forbiddenCityJson);
test('Workflows loaded', Array.isArray(workflows));

// Test 2: Basic properties
test('Forbidden City has correct ID', forbiddenCity?.id === 'forbidden-city');
test('Forbidden City has correct name', forbiddenCity?.name === '故宫博物院');
test('Forbidden City has location', forbiddenCity?.location === '北京');
test('Forbidden City has description', !!forbiddenCity?.description);
test('Forbidden City has tags', Array.isArray(forbiddenCity?.tags));
test('Forbidden City has image URL', !!forbiddenCity?.image);

// Test 3: Collections (three treasures)
test('Has collections array', Array.isArray(forbiddenCity?.collections));
test('Has exactly 3 collections', forbiddenCity?.collections?.length === 3);

if (forbiddenCity?.collections) {
  const treasureNames = forbiddenCity.collections.map(c => c.name);
  test('Has 清明上河图', treasureNames.includes('《清明上河图》'));
  test('Has 金瓯永固杯', treasureNames.includes('金瓯永固杯'));
  test('Has 酗亚方尊', treasureNames.includes('酗亚方尊'));
  
  test('All collections have name', forbiddenCity.collections.every(c => !!c.name));
  test('All collections have imageUrl', forbiddenCity.collections.every(c => !!c.imageUrl));
  test('All collections have description', forbiddenCity.collections.every(c => !!c.description));
}

// Test 4: JSON file matches museums-data.js
test('JSON file has correct ID', forbiddenCityJson.id === 'forbidden-city');
test('JSON file has same collections count', forbiddenCityJson.collections?.length === forbiddenCity?.collections?.length);

// Test 5: Workflows (from workflows-data.js)
test('Has workflows array', Array.isArray(workflows));
test('Has at least 2 workflows', workflows?.length >= 2);

if (workflows) {
  const workflow1 = workflows[0];
  const workflow2 = workflows[1];
  
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

// Test 6: Checklists
test('Has checklists object', !!forbiddenCity?.checklists);
test('Has parent checklists', !!forbiddenCity?.checklists?.parent);
test('Has child checklists', !!forbiddenCity?.checklists?.child);

if (forbiddenCity?.checklists) {
  const parent = forbiddenCity.checklists.parent;
  const child = forbiddenCity.checklists.child;
  
  test('Parent 3-6: has items', Array.isArray(parent?.['3-6']) && parent['3-6'].length > 0);
  test('Parent 7-12: has items', Array.isArray(parent?.['7-12']) && parent['7-12'].length > 0);
  test('Parent 13-18: has items', Array.isArray(parent?.['13-18']) && parent['13-18'].length > 0);
  
  test('Child 3-6: has items', Array.isArray(child?.['3-6']) && child['3-6'].length > 0);
  test('Child 7-12: has items', Array.isArray(child?.['7-12']) && child['7-12'].length > 0);
  test('Child 13-18: has items', Array.isArray(child?.['13-18']) && child['13-18'].length > 0);
}

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('✅ All tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!');
  process.exit(1);
}
