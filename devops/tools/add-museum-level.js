#!/usr/bin/env node

/**
 * Add Museum Level/Grade to Meta
 * Uses verify skill (Letmetry Museum API) to fetch official museum data including level
 * Updates data/museums-meta.json with "level" field for each museum
 */

const fs = require('fs');
const path = require('path');

// 尝试加载集中配置
let API_ENDPOINTS;
try { API_ENDPOINTS = require('../config/api-endpoints.js'); } catch(e) {}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

const symbols = {
  pass: '✅',
  fail: '❌',
  warn: '⚠️ ',
  info: 'ℹ️ ',
  skip: '⏭️ ',
  save: '💾'
};

/**
 * Verify museum and get official data including level
 */
async function verifyMuseum(museumName) {
  try {
    const endpoint = API_ENDPOINTS ? API_ENDPOINTS.MUSEUM.SEARCH : 'https://letmetry.cloud/museum/search';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ museumName: museumName.trim() })
    });

    if (!response.ok) {
      return { status: 'error', error: `HTTP ${response.status}`, level: null };
    }

    const data = await response.json();

    if (!data.success || !data.museums || data.museums.length === 0) {
      return { status: 'not_found', error: 'Not in official database', level: null };
    }

    // Get best match
    const searchTerm = museumName.toLowerCase();
    const scoredMatches = data.museums.map(museum => {
      const museumNameLower = (museum.name || '').toLowerCase();
      
      if (museumNameLower === searchTerm) {
        return { ...museum, score: 100 };
      }
      
      if (museumNameLower.includes(searchTerm) || searchTerm.includes(museumNameLower)) {
        return { ...museum, score: 80 };
      }
      
      return { ...museum, score: 50 };
    });

    scoredMatches.sort((a, b) => b.score - a.score);
    const bestMatch = scoredMatches[0];

    if (bestMatch.score < 60) {
      return { status: 'low_score', score: bestMatch.score, level: null };
    }

    const level = bestMatch.qualityGrade || bestMatch.level || bestMatch.grade || null;
    return { 
      status: 'success', 
      level,
      score: bestMatch.score,
      officialName: bestMatch.name,
      location: bestMatch.province || bestMatch.location || null
    };
  } catch (error) {
    return { status: 'error', error: error.message, level: null };
  }
}

/**
 * Add level field to meta data
 */
async function addMuseumLevel(metaPath, startIndex = 0, limit = null) {
  const metaContent = fs.readFileSync(metaPath, 'utf-8');
  const meta = JSON.parse(metaContent);

  const endIndex = limit ? Math.min(startIndex + limit, meta.length) : meta.length;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  console.log(`\n${colors.cyan}🔍 Adding museum levels to meta (${startIndex}-${endIndex}/${meta.length})${colors.reset}\n`);

  for (let i = startIndex; i < endIndex; i++) {
    const museum = meta[i];
    const museumName = museum.name;

    process.stdout.write(`[${i + 1}/${meta.length}] ${museumName}... `);

    // Skip if level already exists
    if (museum.level) {
      console.log(`${symbols.skip} ${colors.gray}已有等级${colors.reset}`);
      skipped++;
      continue;
    }

    // Add delay to avoid rate limiting
    if (i > startIndex) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const result = await verifyMuseum(museumName);

    if (result.status === 'success') {
      museum.level = result.level;
      console.log(`${symbols.pass} ${colors.green}${result.level || '未分级'}${colors.reset}`);
      updated++;
    } else if (result.status === 'not_found') {
      console.log(`${symbols.warn} ${colors.yellow}官方库未找到${colors.reset}`);
      errors++;
    } else if (result.status === 'low_score') {
      console.log(`${symbols.warn} ${colors.yellow}匹配度低(${result.score}%)${colors.reset}`);
      errors++;
    } else {
      console.log(`${symbols.fail} ${colors.yellow}${result.error}${colors.reset}`);
      errors++;
    }
  }

  // Save updated meta
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');

  console.log(`\n${colors.cyan}📊 Results:${colors.reset}`);
  console.log(`  ${symbols.pass} Updated: ${colors.green}${updated}${colors.reset}`);
  console.log(`  ${symbols.skip} Skipped: ${colors.gray}${skipped}${colors.reset}`);
  console.log(`  ${symbols.fail} Errors: ${colors.yellow}${errors}${colors.reset}`);
  console.log(`\n${symbols.save} ${colors.cyan}Saved to ${metaPath}${colors.reset}\n`);
}

// CLI
const args = process.argv.slice(2);
const metaPath = path.join(__dirname, '../../data/museums-meta.json');

let startIndex = 0;
let limit = null;

// Parse arguments
if (args.includes('--start')) {
  startIndex = parseInt(args[args.indexOf('--start') + 1]) || 0;
}
if (args.includes('--limit')) {
  limit = parseInt(args[args.indexOf('--limit') + 1]) || null;
}
if (args.includes('--all')) {
  startIndex = 0;
  limit = null;
}

// Show help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage:
  node tools/add-museum-level.js [options]

Options:
  --start <n>     Start from index (default: 0)
  --limit <n>     Process only n museums
  --all           Process all museums
  --help          Show this help
  
Examples:
  node tools/add-museum-level.js --limit 10      # First 10
  node tools/add-museum-level.js --start 50 --limit 20  # From 50, 20 museums
  node tools/add-museum-level.js --all           # All museums
  `);
  process.exit(0);
}

addMuseumLevel(metaPath, startIndex, limit).catch(err => {
  console.error(`${symbols.fail} ${colors.red}Error: ${err.message}${colors.reset}`);
  process.exit(1);
});
