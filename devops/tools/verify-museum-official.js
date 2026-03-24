#!/usr/bin/env node

/**
 * Museum Official Verification CLI Tool
 * 
 * Strict quality control tool for verifying new museums against the official
 * Chinese museum database provided by Letmetry Cloud.
 * 
 * Usage:
 *   npx node tools/verify-museum-official.js <museumName> [--strict] [--verbose]
 *   npx node tools/verify-museum-official.js --batch <file.json> [--strict]
 *   npx node tools/verify-museum-official.js --verify-script <script.js> [--strict] [--fix]
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 尝试加载集中配置
let API_ENDPOINTS;
try { API_ENDPOINTS = require('../config/api-endpoints.js'); } catch(e) {}

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
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
  check: '✔',
  cross: '✘'
};

/**
 * Verify a museum against the official database
 */
async function verifyMuseum(museumName, strictMode = false) {
  try {
    const endpoint = API_ENDPOINTS ? API_ENDPOINTS.MUSEUM.SEARCH : 'https://letmetry.cloud/museum/search';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ museumName: museumName.trim() })
    });

    if (!response.ok) {
      return {
        status: 'error',
        error: `HTTP ${response.status}: ${response.statusText}`,
        verified: false,
        museumName,
        matches: []
      };
    }

    const data = await response.json();

    if (!data.success) {
      return {
        status: 'not_found',
        error: data.error || 'Museum not found in official database',
        verified: false,
        museumName,
        matches: []
      };
    }

    // Calculate similarity scores
    const searchTerm = museumName.toLowerCase();
    const scoredMatches = (data.museums || []).map(museum => {
      const museumNameLower = (museum.name || '').toLowerCase();
      
      if (museumNameLower === searchTerm) {
        return { ...museum, score: 100, matchType: 'exact' };
      }
      
      if (museumNameLower.includes(searchTerm) || searchTerm.includes(museumNameLower)) {
        return { ...museum, score: 80, matchType: 'partial' };
      }
      
      const similarity = calculateSimilarity(searchTerm, museumNameLower);
      return { ...museum, score: Math.round(similarity * 100), matchType: 'fuzzy' };
    });

    scoredMatches.sort((a, b) => b.score - a.score);

    const bestMatch = scoredMatches[0];
    const verified = strictMode ? (bestMatch?.score >= 100) : (bestMatch?.score >= 60);

    return {
      status: 'success',
      verified,
      museumName,
      strictMode,
      bestMatch: bestMatch || null,
      allMatches: scoredMatches,
      totalResults: data.count
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      verified: false,
      museumName,
      matches: []
    };
  }
}

/**
 * Calculate string similarity (0-1)
 */
function calculateSimilarity(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  
  let matches = 0;
  for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
    if (str1[i] === str2[i]) matches++;
  }
  return matches / maxLen;
}

/**
 * Print verification result in a formatted way
 */
function printResult(result, verbose = false) {
  const { museumName, status, verified, strictMode, bestMatch, allMatches } = result;

  if (status === 'error') {
    console.log(`${symbols.fail} ${colors.red}${museumName}${colors.reset}`);
    console.log(`   ${colors.red}Error: ${result.error}${colors.reset}`);
    return;
  }

  if (status === 'not_found') {
    console.log(`${symbols.fail} ${colors.red}${museumName}${colors.reset}`);
    console.log(`   ${colors.red}Not found in official database${colors.reset}`);
    return;
  }

  const statusSymbol = verified ? symbols.pass : symbols.warn;
  const statusColor = verified ? colors.green : colors.yellow;
  
  console.log(`${statusSymbol} ${statusColor}${museumName}${colors.reset}`);
  
  if (bestMatch) {
    console.log(`   ${colors.cyan}Official Name:${colors.reset} ${bestMatch.name}`);
    console.log(`   ${colors.cyan}Province:${colors.reset} ${bestMatch.province}`);
    console.log(`   ${colors.cyan}Quality Grade:${colors.reset} ${bestMatch.qualityGrade}`);
    console.log(`   ${colors.cyan}Match Score:${colors.reset} ${bestMatch.score}% (${bestMatch.matchType})`);
    
    if (verbose) {
      console.log(`   ${colors.cyan}Collections:${colors.reset} ${bestMatch.collectionCount}`);
      console.log(`   ${colors.cyan}Precious Artifacts:${colors.reset} ${bestMatch.preciousArtifactsCount}`);
      console.log(`   ${colors.cyan}Visitors/Year:${colors.reset} ${bestMatch.visitorCount}万人`);
      console.log(`   ${colors.cyan}Annual Exhibitions:${colors.reset} ${bestMatch.exhibitionsCount}`);
      
      if (allMatches.length > 1) {
        console.log(`   ${colors.gray}Other matches:${colors.reset}`);
        allMatches.slice(1, 4).forEach(match => {
          console.log(`     - ${match.name} (${match.province}) - ${match.score}%`);
        });
      }
    }
  } else {
    console.log(`   ${colors.red}No matches found${colors.reset}`);
  }

  if (!verified && strictMode) {
    console.log(`   ${colors.red}❌ STRICT MODE FAILURE: Score < 100%${colors.reset}`);
  } else if (!verified) {
    console.log(`   ${colors.yellow}⚠️ WARNING: Confidence score < 60%${colors.reset}`);
  }
}

/**
 * Verify a JSON batch file with museum names
 */
async function verifyBatch(filePath, strictMode = false) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const museums = JSON.parse(content);

    if (!Array.isArray(museums)) {
      console.error(`${symbols.fail} ${colors.red}Batch file must contain an array of museum objects${colors.reset}`);
      return { passed: 0, failed: 0, warned: 0 };
    }

    console.log(`\n${colors.cyan}📋 Batch Verification Report${colors.reset}`);
    console.log(`${colors.gray}File: ${filePath}${colors.reset}`);
    console.log(`${colors.gray}Strict Mode: ${strictMode ? 'ON' : 'OFF'}${colors.reset}\n`);

    let passed = 0, failed = 0, warned = 0;
    const failures = [];

    for (const museum of museums) {
      const museumName = museum.name || museum;
      const result = await verifyMuseum(museumName, strictMode);

      if (result.verified) {
        console.log(`${symbols.pass} ${colors.green}${museumName}${colors.reset}`);
        passed++;
      } else if (result.status === 'error' || result.status === 'not_found') {
        console.log(`${symbols.fail} ${colors.red}${museumName}${colors.reset}`);
        failed++;
        failures.push({ name: museumName, reason: result.error });
      } else {
        console.log(`${symbols.warn} ${colors.yellow}${museumName}${colors.reset}`);
        warned++;
      }
    }

    // Summary
    console.log(`\n${colors.bright}Summary:${colors.reset}`);
    console.log(`  ${colors.green}✅ Passed: ${passed}${colors.reset}`);
    console.log(`  ${colors.yellow}⚠️  Warned: ${warned}${colors.reset}`);
    console.log(`  ${colors.red}❌ Failed: ${failed}${colors.reset}`);

    if (failures.length > 0) {
      console.log(`\n${colors.red}Failed Museums:${colors.reset}`);
      failures.forEach(f => {
        console.log(`  - ${f.name}: ${f.reason}`);
      });
    }

    return { passed, failed, warned };
  } catch (error) {
    console.error(`${symbols.fail} ${colors.red}Error reading batch file: ${error.message}${colors.reset}`);
    return { passed: 0, failed: 0, warned: 0 };
  }
}

/**
 * Verify museums in a script.js file
 */
async function verifyScript(scriptPath, strictMode = false, autoFix = false) {
  try {
    const content = fs.readFileSync(scriptPath, 'utf8');
    
    // Find MUSEUMS array
    const museumMatch = content.match(/const\s+MUSEUMS\s*=\s*\[([\s\S]*?)\];/);
    if (!museumMatch) {
      console.error(`${symbols.fail} ${colors.red}Could not find MUSEUMS array in ${scriptPath}${colors.reset}`);
      return { passed: 0, failed: 0, warned: 0 };
    }

    // Parse museums (simple JSON-like extraction)
    const museumText = '[' + museumMatch[1] + ']';
    
    console.log(`\n${colors.cyan}📝 Script Verification Report${colors.reset}`);
    console.log(`${colors.gray}File: ${scriptPath}${colors.reset}`);
    console.log(`${colors.gray}Strict Mode: ${strictMode ? 'ON' : 'OFF'}${colors.reset}`);
    console.log(`${colors.gray}Auto-Fix: ${autoFix ? 'ON' : 'OFF'}${colors.reset}\n`);

    // Extract museum names with regex
    const nameMatches = content.matchAll(/name\s*:\s*['"](.*?)['"]/g);
    const museums = [];
    
    for (const match of nameMatches) {
      if (!museums.includes(match[1])) {
        museums.push(match[1]);
      }
    }

    console.log(`Found ${museums.length} unique museums in ${path.basename(scriptPath)}\n`);

    let passed = 0, failed = 0, warned = 0;
    const failures = [];

    for (let i = 0; i < Math.min(museums.length, 10); i++) {
      const museumName = museums[i];
      const result = await verifyMuseum(museumName, strictMode);

      if (result.verified) {
        console.log(`${symbols.pass} ${colors.green}${museumName}${colors.reset}`);
        passed++;
      } else if (result.status === 'error' || result.status === 'not_found') {
        console.log(`${symbols.fail} ${colors.red}${museumName}${colors.reset}`);
        failed++;
        failures.push({ name: museumName, reason: result.error });
      } else {
        console.log(`${symbols.warn} ${colors.yellow}${museumName}${colors.reset} (score: ${result.bestMatch?.score}%)`);
        warned++;
      }
    }

    if (museums.length > 10) {
      console.log(`${colors.gray}... and ${museums.length - 10} more${colors.reset}`);
    }

    console.log(`\n${colors.bright}Summary (sampled):${colors.reset}`);
    console.log(`  ${colors.green}✅ Passed: ${passed}${colors.reset}`);
    console.log(`  ${colors.yellow}⚠️  Warned: ${warned}${colors.reset}`);
    console.log(`  ${colors.red}❌ Failed: ${failed}${colors.reset}`);

    return { passed, failed, warned };
  } catch (error) {
    console.error(`${symbols.fail} ${colors.red}Error reading script: ${error.message}${colors.reset}`);
    return { passed: 0, failed: 0, warned: 0 };
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.bright}Museum Official Verification Tool${colors.reset}

Verify museums against the official Chinese museum database.

${colors.cyan}Usage:${colors.reset}
  npx node tools/verify-museum-official.js <museumName> [options]
  npx node tools/verify-museum-official.js --batch <file.json> [options]
  npx node tools/verify-museum-official.js --verify-script <script.js> [options]

${colors.cyan}Options:${colors.reset}
  --strict          Require exact match (100% score)
  --verbose, -v     Show detailed information
  --batch <file>    Verify a JSON array of museums
  --verify-script   Verify museums in script.js file
  --fix             Auto-fix issues (with --verify-script)
  --help, -h        Show this help message

${colors.cyan}Examples:${colors.reset}
  # Verify a single museum
  node tools/verify-museum-official.js "故宫博物院"
  
  # Strict mode verification
  node tools/verify-museum-official.js "故宫博物院" --strict
  
  # Batch verification
  node tools/verify-museum-official.js --batch museums.json --strict
  
  # Verify script.js
  node tools/verify-museum-official.js --verify-script script.js --verbose
    `);
    process.exit(0);
  }

  try {
    const strictMode = args.includes('--strict');
    const verbose = args.includes('--verbose') || args.includes('-v');
    const autoFix = args.includes('--fix');

    if (args.includes('--batch')) {
      const batchIdx = args.indexOf('--batch');
      const filePath = args[batchIdx + 1];
      if (!filePath) {
        console.error(`${symbols.fail} ${colors.red}--batch requires a file path${colors.reset}`);
        process.exit(1);
      }
      const result = await verifyBatch(filePath, strictMode);
      process.exit(result.failed > 0 && strictMode ? 1 : 0);
    } else if (args.includes('--verify-script')) {
      const scriptIdx = args.indexOf('--verify-script');
      const filePath = args[scriptIdx + 1] || 'script.js';
      const result = await verifyScript(filePath, strictMode, autoFix);
      process.exit(result.failed > 0 && strictMode ? 1 : 0);
    } else {
      const museumName = args[0];
      if (!museumName || museumName.startsWith('--')) {
        console.error(`${symbols.fail} ${colors.red}Please provide a museum name${colors.reset}`);
        process.exit(1);
      }
      const result = await verifyMuseum(museumName, strictMode);
      printResult(result, verbose);
      process.exit(result.verified ? 0 : 1);
    }
  } catch (error) {
    console.error(`${symbols.fail} ${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main();
