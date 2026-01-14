#!/usr/bin/env node

/**
 * Upload museums to KV store with CORRECT API format
 * 
 * CORRECT FORMAT (verified from docs/guides/museum-7-step-workflow.md):
 * - Endpoint: https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore
 * - Key: museum-data-<id>  (NOT museum-<id>)
 * - SortKey: 'museum' (NOT metadata)
 * - Data: includes collections array with treasures
 */

const fs = require('fs');
const path = require('path');

const KV_ENDPOINT = 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';

// Color codes for console output
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

async function uploadMuseumToKVStore(museum) {
  const key = `museum-data-${museum.id}`;
  const sortKey = 'museum';

  // Prepare data structure for KV store
  const kvData = {
    id: museum.id,
    name: museum.name,
    location: museum.location,
    tags: museum.tags || [],
    image: museum.image || '',
    level: museum.level || null,
    hasCollections: museum.hasCollections || false,
    collections: museum.collections || [], // Will be populated with treasures
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(KV_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: key,
        sortKey: sortKey,
        value: JSON.stringify(kvData),
        expireAt: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year expiry
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        museum: museum.name,
        id: museum.id,
        error: `HTTP ${response.status}: ${errorText}`
      };
    }

    const result = await response.json();
    return {
      success: true,
      museum: museum.name,
      id: museum.id,
      key: key,
      sortKey: sortKey
    };
  } catch (error) {
    return {
      success: false,
      museum: museum.name,
      id: museum.id,
      error: error.message
    };
  }
}

async function verifyMuseumInKVStore(museumId) {
  const key = `museum-data-${museumId}`;
  const sortKey = 'museum';

  try {
    const url = new URL(KV_ENDPOINT);
    url.searchParams.append('key', key);
    url.searchParams.append('sortKey', sortKey);

    const response = await fetch(url.toString(), {
      method: 'GET'
    });

    if (!response.ok) {
      return {
        success: false,
        id: museumId,
        error: `HTTP ${response.status}`
      };
    }

    const result = await response.json();
    return {
      success: true,
      id: museumId,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      id: museumId,
      error: error.message
    };
  }
}

async function main() {
  const metaPath = path.join(__dirname, '../data/museums-meta.json');

  if (!fs.existsSync(metaPath)) {
    log(`Error: museums-meta.json not found at ${metaPath}`, 'red');
    process.exit(1);
  }

  const metaData = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  log(`\n📊 Starting KV store upload for ${metaData.length} museums...`, 'cyan');
  log(`KV Endpoint: ${KV_ENDPOINT}`, 'blue');
  log(`Key format: museum-data-<id>`, 'blue');
  log(`SortKey: 'museum'\n`, 'blue');

  const uploadResults = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < metaData.length; i++) {
    const museum = metaData[i];
    process.stdout.write(`\r[${i + 1}/${metaData.length}] Uploading ${museum.name}...`);

    const result = await uploadMuseumToKVStore(museum);
    uploadResults.push(result);

    if (result.success) {
      successCount++;
    } else {
      failureCount++;
    }

    // Rate limiting: 100ms between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  log(`\n\n📈 Upload Results:`, 'cyan');
  log(`✅ Success: ${successCount}`, 'green');
  log(`❌ Failed: ${failureCount}`, failureCount > 0 ? 'red' : 'green');

  // Show sample of failures
  const failures = uploadResults.filter(r => !r.success);
  if (failures.length > 0) {
    log(`\n⚠️  Failed uploads (first 5):`, 'yellow');
    failures.slice(0, 5).forEach(f => {
      log(`   ${f.museum}: ${f.error}`, 'yellow');
    });
  }

  // Verify a sample of uploads
  log(`\n🔍 Verifying sample of uploads (first 5 museums)...`, 'cyan');
  const sampleIds = metaData.slice(0, 5).map(m => m.id);
  const verificationResults = [];

  for (const id of sampleIds) {
    const result = await verifyMuseumInKVStore(id);
    verificationResults.push(result);
    process.stdout.write(`\r✓ Verified ${verificationResults.length}/${sampleIds.length}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  log(`\n✅ Verification complete`, 'green');
  const verifySuccess = verificationResults.filter(r => r.success).length;
  log(`   ${verifySuccess}/${verificationResults.length} reads successful`, 'green');

  // Save upload report
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(__dirname, `../backup/kvstore-upload-report-${timestamp}.json`);
  const report = {
    timestamp: new Date().toISOString(),
    endpoint: KV_ENDPOINT,
    keyFormat: 'museum-data-<id>',
    sortKey: 'museum',
    totalMuseums: metaData.length,
    successCount: successCount,
    failureCount: failureCount,
    successRate: `${((successCount / metaData.length) * 100).toFixed(1)}%`,
    sample_verification: {
      total: verificationResults.length,
      success: verifySuccess,
      results: verificationResults.slice(0, 3)
    },
    failures: failures.slice(0, 10)
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log(`\n📄 Report saved to: ${reportPath}`, 'blue');

  if (failureCount === 0) {
    log(`\n✨ All museums uploaded successfully!`, 'green');
  } else {
    log(`\n⚠️  ${failureCount} museums failed to upload. Check report for details.`, 'yellow');
  }
}

main().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
