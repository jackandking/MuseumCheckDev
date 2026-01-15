#!/usr/bin/env node

/**
 * Add collections (treasures) data for all museums
 * Uses verify skill API to fetch museum treasures and details
 * 
 * VERIFY SKILL ENDPOINT: https://letmetry.cloud/museum/search
 * Returns: collections, treasures, famous collections info
 */

const fs = require('fs');
const path = require('path');

// 尝试加载集中配置
let API_ENDPOINTS;
try { API_ENDPOINTS = require('../config/api-endpoints.js'); } catch(e) {}

const VERIFY_ENDPOINT = API_ENDPOINTS ? API_ENDPOINTS.MUSEUM.SEARCH : 'https://letmetry.cloud/museum/search';
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

async function getMuseumVerifyData(museumName) {
  try {
    const response = await fetch(VERIFY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ museumName: museumName })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}

async function updateMuseumInKVStore(museum, collections) {
  const key = `museum-data-${museum.id}`;
  const sortKey = 'museum';

  const kvData = {
    id: museum.id,
    name: museum.name,
    location: museum.location,
    tags: museum.tags || [],
    image: museum.image || '',
    level: museum.level || null,
    hasCollections: collections.length > 0,
    collections: collections,
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
        expireAt: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
      })
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

// Sample collections for demonstration (from 7-step workflow)
// In production, these should come from verify skill API or treasure database
const SAMPLE_COLLECTIONS = {
  'forbidden-city': [
    {
      name: '《清明上河图》',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Qingming_Scroll_2008x5605_mt.jpg',
      description: '北宋张择端绘制的社会风俗画，宽25.2厘米，长528.7厘米'
    },
    {
      name: '青花瓷瓶',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Vase_with_cover%2C_Qing_dynasty%2C_Kangxi_period.jpg/640px-Vase_with_cover%2C_Qing_dynasty%2C_Kangxi_period.jpg',
      description: '清代康熙年间制造的精美青花瓷器，反映了当时的工艺水平'
    },
    {
      name: '铜镀金佛像',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Met_07.228.117_view4.jpg',
      description: '明代铜镀金佛像，高约30厘米，工艺精湛'
    }
  ],
  'national-museum': [
    {
      name: '后母戊鼎',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Simuwu_ding.jpg/640px-Simuwu_ding.jpg',
      description: '商代晚期青铜器，中国古代最著名的器物之一'
    },
    {
      name: '人头壶',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Pot_with_human_faces%2C_Yangshao_culture.jpg',
      description: '新石器时代彩陶，距今约7000年'
    },
    {
      name: '唐三彩马',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Tang_Dynasty_tomb_pottery_3_color_horse.jpg',
      description: '唐代陶制骏马，彩釉工艺完美'
    }
  ]
};

async function main() {
  const metaPath = path.join(__dirname, '../data/museums-meta.json');
  let metaData = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

  log(`\n🏛️  Adding collections data for ${metaData.length} museums...`, 'cyan');
  log(`Using verify skill API: ${VERIFY_ENDPOINT}\n`, 'blue');

  const results = {
    updated: 0,
    failed: 0,
    withSampleCollections: 0,
    details: []
  };

  for (let i = 0; i < metaData.length; i++) {
    const museum = metaData[i];
    process.stdout.write(`\r[${i + 1}/${metaData.length}] Processing ${museum.name}...`);

    let collections = [];

    // Try to get collections from sample data
    if (SAMPLE_COLLECTIONS[museum.id]) {
      collections = SAMPLE_COLLECTIONS[museum.id];
      results.withSampleCollections++;
    } else {
      // Try to fetch from verify skill API
      const verifyData = await getMuseumVerifyData(museum.name);
      if (verifyData && verifyData.collections) {
        collections = verifyData.collections.slice(0, 3); // Max 3
      }
    }

    // Update museum metadata
    if (collections.length > 0) {
      metaData[i].collections = collections;
      metaData[i].hasCollections = true;
    } else {
      metaData[i].collections = [];
      metaData[i].hasCollections = false;
    }

    // Update in KV store
    const updated = await updateMuseumInKVStore(metaData[i], metaData[i].collections);
    if (updated) {
      results.updated++;
    } else {
      results.failed++;
    }

    results.details.push({
      id: museum.id,
      name: museum.name,
      collectionsCount: collections.length,
      kvUpdated: updated
    });

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Save updated meta
  fs.writeFileSync(metaPath, JSON.stringify(metaData, null, 2));

  log(`\n\n📈 Collections Update Results:`, 'cyan');
  log(`✅ KV store updated: ${results.updated}/${metaData.length}`, 'green');
  log(`❌ Failed updates: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`📊 Using sample collections: ${results.withSampleCollections}`, 'blue');

  // Count by collection count
  const byCount = { 0: 0, 1: 0, 2: 0, 3: 0, 'more': 0 };
  results.details.forEach(d => {
    const count = Math.min(d.collectionsCount, 3);
    if (count in byCount) {
      byCount[count]++;
    }
  });

  log(`\n📊 Collections per museum:`, 'cyan');
  log(`   0 treasures: ${byCount[0]}`, 'blue');
  log(`   1 treasure: ${byCount[1]}`, 'blue');
  log(`   2 treasures: ${byCount[2]}`, 'blue');
  log(`   3 treasures: ${byCount[3]}`, 'blue');

  // Sample output
  log(`\n🏛️  Sample museums with collections:`, 'cyan');
  results.details
    .filter(d => d.collectionsCount > 0)
    .slice(0, 3)
    .forEach(d => {
      log(`   ${d.name}: ${d.collectionsCount} treasures ✓`, 'green');
    });

  // Save report
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(__dirname, `../backup/collections-update-report-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalMuseums: metaData.length,
    updated: results.updated,
    failed: results.failed,
    byCollectionCount: byCount,
    summary: results.details.slice(0, 5)
  }, null, 2));

  log(`\n📄 Report saved to: ${reportPath}`, 'blue');
  log(`\n✨ Collections data update complete!`, 'green');
}

main().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
