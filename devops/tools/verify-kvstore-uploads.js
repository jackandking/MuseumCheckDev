#!/usr/bin/env node

/**
 * Comprehensive verification of KV store uploads
 * Tests: data structure, key format, sortKey, field presence, image URLs
 */

const fs = require('fs');
const path = require('path');

const KV_ENDPOINT = 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function fetchMuseumFromKV(museumId) {
  const key = `museum-data-${museumId}`;
  const sortKey = 'museum';

  try {
    const url = new URL(KV_ENDPOINT);
    url.searchParams.append('key', key);
    url.searchParams.append('sortKey', sortKey);

    const response = await fetch(url.toString(), { method: 'GET' });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}`
      };
    }

    const result = await response.json();
    return {
      success: true,
      raw: result,
      data: JSON.parse(result.value)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function verifyMuseumStructure(museumData) {
  const issues = [];

  // Check required fields
  const requiredFields = ['id', 'name', 'location'];
  for (const field of requiredFields) {
    if (!museumData[field]) {
      issues.push(`Missing required field: ${field}`);
    }
  }

  // Check optional fields
  if (!Array.isArray(museumData.tags)) {
    issues.push('tags should be an array');
  }

  if (typeof museumData.image !== 'string') {
    issues.push('image should be a string');
  }

  if (!['一级', '二级', '三级', '未定级', null].includes(museumData.level)) {
    issues.push(`Invalid level value: ${museumData.level}`);
  }

  // Check collections structure
  if (!Array.isArray(museumData.collections)) {
    issues.push('collections should be an array');
  } else {
    museumData.collections.forEach((coll, idx) => {
      if (coll.name && typeof coll.name !== 'string') {
        issues.push(`collections[${idx}].name should be string`);
      }
      if (coll.imageUrl && typeof coll.imageUrl !== 'string') {
        issues.push(`collections[${idx}].imageUrl should be string`);
      }
    });
  }

  return issues;
}

async function main() {
  const metaPath = path.join(__dirname, '../../data/museums-meta.json');
  const metaData = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

  log(`\n🔍 Verifying KV store uploads...`, 'cyan');
  log(`Total museums to verify: ${metaData.length}`, 'blue');

  // Test a diverse sample
  const sampleSize = Math.min(20, metaData.length);
  const sampleIndices = [];
  for (let i = 0; i < sampleSize; i++) {
    sampleIndices.push(Math.floor((i / sampleSize) * metaData.length));
  }

  const results = {
    total: sampleIndices.length,
    success: 0,
    failures: [],
    structureIssues: [],
    missingImages: 0,
    withCollections: 0,
    levels: {}
  };

  for (let i = 0; i < sampleIndices.length; i++) {
    const idx = sampleIndices[i];
    const museum = metaData[idx];
    process.stdout.write(`\r[${i + 1}/${sampleIndices.length}] Verifying ${museum.name}...`);

    const result = await fetchMuseumFromKV(museum.id);

    if (!result.success) {
      results.failures.push({
        id: museum.id,
        name: museum.name,
        error: result.error
      });
    } else {
      results.success++;

      const data = result.data;
      const issues = await verifyMuseumStructure(data);

      if (issues.length > 0) {
        results.structureIssues.push({
          id: data.id,
          name: data.name,
          issues: issues
        });
      }

      if (!data.image || data.image === '') {
        results.missingImages++;
      }

      if (data.collections && data.collections.length > 0) {
        results.withCollections++;
      }

      const level = data.level || 'null';
      results.levels[level] = (results.levels[level] || 0) + 1;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  log(`\n\n📊 Verification Results:`, 'cyan');
  log(`✅ Successfully read: ${results.success}/${results.total}`, 'green');
  log(`❌ Failed to read: ${results.failures.length}/${results.total}`, results.failures.length > 0 ? 'red' : 'green');

  if (results.failures.length > 0) {
    log(`\nFailed museums:`, 'yellow');
    results.failures.forEach(f => {
      log(`  ${f.name}: ${f.error}`, 'yellow');
    });
  }

  log(`\n📈 Data Structure Analysis:`, 'cyan');
  log(`Museums with issues: ${results.structureIssues.length}`, results.structureIssues.length > 0 ? 'yellow' : 'green');
  log(`Museums with building images: ${results.total - results.missingImages}/${results.total}`, 'blue');
  log(`Museums with collections: ${results.withCollections}/${results.total}`, 'blue');

  log(`\n📊 Level Distribution:`, 'cyan');
  Object.keys(results.levels).sort().forEach(level => {
    log(`  ${level}: ${results.levels[level]}`, 'blue');
  });

  if (results.structureIssues.length > 0) {
    log(`\n⚠️  Structure issues (first 3):`, 'yellow');
    results.structureIssues.slice(0, 3).forEach(issue => {
      log(`  ${issue.name}:`, 'yellow');
      issue.issues.forEach(i => log(`    - ${i}`, 'yellow'));
    });
  }

  const verificationPath = path.join(__dirname, `../../backup/kvstore-verification-${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(verificationPath, JSON.stringify(results, null, 2));

  log(`\n📄 Verification report saved to: ${verificationPath}`, 'blue');

  if (results.failures.length === 0 && results.structureIssues.length === 0) {
    log(`\n✨ All verifications passed!`, 'green');
  }
}

main().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
