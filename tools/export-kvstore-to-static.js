#!/usr/bin/env node

/**
 * Export Museum Data from KV Store to Static JSON Files
 * 
 * This tool fetches museum data from the KV store (Tier 2) and generates
 * individual static JSON files (Tier 1) in the /museums/ directory.
 * 
 * Usage:
 *   node tools/export-kvstore-to-static.js [options]
 * 
 * Options:
 *   --all              Export all museums from museums-data.js
 *   --museum <id>      Export specific museum by ID
 *   --museums <ids>    Export multiple museums (comma-separated)
 *   --output <dir>     Output directory (default: ./museums)
 *   --dry-run          Show what would be exported without writing files
 *   --force            Overwrite existing files
 *   --help             Show this help message
 * 
 * Examples:
 *   node tools/export-kvstore-to-static.js --all
 *   node tools/export-kvstore-to-static.js --museum forbidden-city
 *   node tools/export-kvstore-to-static.js --museums forbidden-city,national-museum
 *   node tools/export-kvstore-to-static.js --all --dry-run
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const KV_STORE_ENDPOINT = 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';
const KV_STORE_KEY_PREFIX = 'museum-data-';
const DEFAULT_OUTPUT_DIR = path.join(__dirname, '..', 'museums');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

/**
 * Fetch museum data from KV store
 */
async function fetchFromKVStore(museumId) {
  return new Promise((resolve, reject) => {
    const key = `${KV_STORE_KEY_PREFIX}${museumId}`;
    const sortKey = 'museum';
    const url = `${KV_STORE_ENDPOINT}?key=${encodeURIComponent(key)}&sortKey=${encodeURIComponent(sortKey)}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode !== 200) {
          resolve(null);
          return;
        }
        
        try {
          const result = JSON.parse(data);
          if (result && result.value) {
            const museumData = JSON.parse(result.value);
            resolve(museumData);
          } else {
            resolve(null);
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Load all museums from museums-data.js
 */
function loadAllMuseums() {
  try {
    const museumsDataPath = path.join(__dirname, '..', 'museums-data.js');
    const content = fs.readFileSync(museumsDataPath, 'utf8');
    
    // Extract MUSEUMS array from the file
    const match = content.match(/const MUSEUMS = \[([\s\S]*?)\];/);
    if (!match) {
      throw new Error('Could not find MUSEUMS array in museums-data.js');
    }
    
    // Use eval to parse the array (safe in this context as we control the file)
    const museums = eval(`[${match[1]}]`);
    return museums;
  } catch (error) {
    console.error(`${colors.red}Error loading museums-data.js:${colors.reset}`, error.message);
    return [];
  }
}

/**
 * Write museum data to JSON file
 */
function writeMuseumFile(museumId, data, outputDir, force = false) {
  const filename = `${museumId}.json`;
  const filepath = path.join(outputDir, filename);
  
  // Check if file exists and force flag is not set
  if (fs.existsSync(filepath) && !force) {
    console.log(`  ${colors.yellow}⚠${colors.reset}  File exists, skipping (use --force to overwrite): ${filename}`);
    return false;
  }
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write JSON file with pretty formatting
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  ${colors.green}✓${colors.reset}  Written: ${filename}`);
  return true;
}

/**
 * Export museum data from KV store to static file
 */
async function exportMuseum(museumId, outputDir, dryRun = false, force = false) {
  try {
    console.log(`${colors.cyan}Fetching${colors.reset} ${museumId} from KV store...`);
    
    const data = await fetchFromKVStore(museumId);
    
    if (!data) {
      console.log(`  ${colors.gray}✗${colors.reset}  Not found in KV store: ${museumId}`);
      return { success: false, reason: 'not_found' };
    }
    
    if (dryRun) {
      console.log(`  ${colors.cyan}[DRY RUN]${colors.reset} Would write: ${museumId}.json`);
      console.log(`  ${colors.gray}Data preview:${colors.reset} ${data.name} (${data.location})`);
      return { success: true, reason: 'dry_run' };
    }
    
    const written = writeMuseumFile(museumId, data, outputDir, force);
    return { success: written, reason: written ? 'success' : 'exists' };
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset}  Error: ${error.message}`);
    return { success: false, reason: 'error', error };
  }
}

/**
 * Export all museums from KV store
 */
async function exportAllMuseums(outputDir, dryRun = false, force = false) {
  console.log(`${colors.bright}Loading museum list...${colors.reset}\n`);
  
  const museums = loadAllMuseums();
  
  if (museums.length === 0) {
    console.log(`${colors.red}No museums found in museums-data.js${colors.reset}`);
    return;
  }
  
  console.log(`Found ${colors.bright}${museums.length}${colors.reset} museums in museums-data.js\n`);
  
  const stats = {
    total: museums.length,
    success: 0,
    notFound: 0,
    exists: 0,
    errors: 0
  };
  
  // Process museums with rate limiting to avoid overwhelming the API
  const BATCH_SIZE = 5;
  const DELAY_MS = 500;
  
  for (let i = 0; i < museums.length; i += BATCH_SIZE) {
    const batch = museums.slice(i, i + BATCH_SIZE);
    
    await Promise.all(
      batch.map(async (museum) => {
        const result = await exportMuseum(museum.id, outputDir, dryRun, force);
        
        if (result.success) {
          stats.success++;
        } else if (result.reason === 'not_found') {
          stats.notFound++;
        } else if (result.reason === 'exists') {
          stats.exists++;
        } else if (result.reason === 'error') {
          stats.errors++;
        }
      })
    );
    
    // Add delay between batches
    if (i + BATCH_SIZE < museums.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
  
  // Print summary
  console.log(`\n${colors.bright}Export Summary:${colors.reset}`);
  console.log(`  Total museums:     ${stats.total}`);
  console.log(`  ${colors.green}✓${colors.reset} Successfully exported: ${stats.success}`);
  console.log(`  ${colors.gray}✗${colors.reset} Not found in KV store: ${stats.notFound}`);
  console.log(`  ${colors.yellow}⚠${colors.reset} Already exists:       ${stats.exists}`);
  console.log(`  ${colors.red}✗${colors.reset} Errors:              ${stats.errors}`);
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    all: false,
    museum: null,
    museums: [],
    outputDir: DEFAULT_OUTPUT_DIR,
    dryRun: false,
    force: false,
    help: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--all':
        options.all = true;
        break;
      case '--museum':
        options.museum = args[++i];
        break;
      case '--museums':
        options.museums = args[++i].split(',').map(id => id.trim());
        break;
      case '--output':
        options.outputDir = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--force':
        options.force = true;
        break;
      case '--help':
        options.help = true;
        break;
      default:
        console.log(`${colors.yellow}Warning: Unknown option ${arg}${colors.reset}`);
    }
  }
  
  return options;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
${colors.bright}Export Museum Data from KV Store to Static JSON Files${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node tools/export-kvstore-to-static.js [options]

${colors.cyan}Options:${colors.reset}
  --all              Export all museums from museums-data.js
  --museum <id>      Export specific museum by ID
  --museums <ids>    Export multiple museums (comma-separated)
  --output <dir>     Output directory (default: ./museums)
  --dry-run          Show what would be exported without writing files
  --force            Overwrite existing files
  --help             Show this help message

${colors.cyan}Examples:${colors.reset}
  ${colors.gray}# Export all museums${colors.reset}
  node tools/export-kvstore-to-static.js --all

  ${colors.gray}# Export specific museum${colors.reset}
  node tools/export-kvstore-to-static.js --museum forbidden-city

  ${colors.gray}# Export multiple museums${colors.reset}
  node tools/export-kvstore-to-static.js --museums forbidden-city,national-museum

  ${colors.gray}# Dry run to see what would be exported${colors.reset}
  node tools/export-kvstore-to-static.js --all --dry-run

  ${colors.gray}# Export and overwrite existing files${colors.reset}
  node tools/export-kvstore-to-static.js --all --force
`);
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    return;
  }
  
  console.log(`\n${colors.bright}🏛️  Museum Data Export Tool${colors.reset}\n`);
  
  if (options.dryRun) {
    console.log(`${colors.cyan}[DRY RUN MODE]${colors.reset} No files will be written\n`);
  }
  
  // Export all museums
  if (options.all) {
    await exportAllMuseums(options.outputDir, options.dryRun, options.force);
    return;
  }
  
  // Export specific museum
  if (options.museum) {
    await exportMuseum(options.museum, options.outputDir, options.dryRun, options.force);
    return;
  }
  
  // Export multiple museums
  if (options.museums.length > 0) {
    console.log(`Exporting ${options.museums.length} museums...\n`);
    
    const stats = { success: 0, failed: 0 };
    
    for (const museumId of options.museums) {
      const result = await exportMuseum(museumId, options.outputDir, options.dryRun, options.force);
      if (result.success) {
        stats.success++;
      } else {
        stats.failed++;
      }
    }
    
    console.log(`\n${colors.bright}Summary:${colors.reset} ${stats.success} exported, ${stats.failed} failed`);
    return;
  }
  
  // No options specified, show help
  console.log(`${colors.yellow}No export option specified. Use --help for usage information.${colors.reset}\n`);
  showHelp();
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = {
  fetchFromKVStore,
  exportMuseum,
  exportAllMuseums
};
