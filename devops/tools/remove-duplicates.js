#!/usr/bin/env node

/**
 * Simple and Reliable Museum Deduplication Tool
 * 
 * This tool removes specific duplicate museums by index based on the validation results.
 * It preserves the exact JavaScript syntax and formatting.
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_PATH = path.join(__dirname, '..', '..', 'script.js');
const BACKUP_PATH = path.join(__dirname, '..', '..', 'script.js.backup');

// Based on validation results - indices to remove (duplicates and invalid entries)
const INDICES_TO_REMOVE = [
    // Missing required fields
    124, 159, 171,
    
    // Exact duplicates (same name AND same ID) - keep first occurrence
    149, 151, 173, 200, 205, 206, 207, 213, 215, 219, 226, 229, 230, 231, 232, 233, 235, 236, 237, 238, 282,
    
    // Name duplicates with different IDs - remove less complete entry
    150, 161, 172, 204, 208, 209, 210, 212, 214, 216, 217, 218, 227, 228, 246, 247, 248, 261, 279, 287,
    
    // Special case: Keep the better "中国科学技术馆" entry
    7 // Remove china-science-museum, keep china-science-technology-museum at 269
].sort((a, b) => b - a); // Sort in descending order for removal

function main() {
    const isDryRun = process.argv.includes('--dry-run');
    
    console.log('🔧 Simple Museum Deduplication Tool');
    console.log('====================================\n');
    
    if (isDryRun) {
        console.log('🔍 DRY RUN MODE - No files will be modified\n');
    }
    
    // Read current file
    let content;
    try {
        content = fs.readFileSync(SCRIPT_PATH, 'utf8');
    } catch (error) {
        console.error('❌ Error reading script.js:', error.message);
        process.exit(1);
    }
    
    // Parse museums to verify current state  
    const museumArray = extractMuseumArray(content);
    console.log(`📊 Original museum count: ${museumArray.length}`);
    
    // Display what will be removed
    console.log('\n🗑️  MUSEUMS TO REMOVE:');
    console.log('======================');
    INDICES_TO_REMOVE.forEach(index => {
        if (index < museumArray.length) {
            const museum = museumArray[index];
            console.log(`Index ${index}: "${museum.name || 'unnamed'}" (${museum.id})`);
        }
    });
    
    console.log(`\nTotal entries to remove: ${INDICES_TO_REMOVE.length}`);
    console.log(`Final count: ${museumArray.length - INDICES_TO_REMOVE.length}`);
    
    if (!isDryRun) {
        // Create backup
        fs.copyFileSync(SCRIPT_PATH, BACKUP_PATH);
        console.log(`\n💾 Backup created: ${BACKUP_PATH}`);
        
        // Remove museums by index
        const newContent = removeMuseumsByIndex(content, INDICES_TO_REMOVE);
        
        // Write updated content
        fs.writeFileSync(SCRIPT_PATH, newContent, 'utf8');
        console.log(`✅ Updated ${SCRIPT_PATH}`);
        
        console.log('\n🚨 VERIFICATION REQUIRED:');
        console.log('npm run validate-data');
        console.log('npm run test:data-quality');
        
    } else {
        console.log('\n🔍 DRY RUN COMPLETE - No changes made');
        console.log('Run without --dry-run to apply changes');
    }
}

function extractMuseumArray(content) {
    try {
        const startIndex = content.indexOf('const MUSEUMS = [');
        const endIndex = content.indexOf('];', startIndex) + 2;
        
        if (startIndex === -1 || endIndex === -1) {
            throw new Error('Could not find MUSEUMS array');
        }
        
        const museumsCode = content.substring(startIndex, endIndex);
        return eval(museumsCode.replace('const MUSEUMS = ', ''));
    } catch (error) {
        console.error('❌ Error parsing museums:', error.message);
        process.exit(1);
    }
}

function removeMuseumsByIndex(content, indicesToRemove) {
    const startIndex = content.indexOf('const MUSEUMS = [');
    const endIndex = content.indexOf('];', startIndex) + 2;
    
    if (startIndex === -1 || endIndex === -1) {
        throw new Error('Could not find MUSEUMS array boundaries');
    }
    
    const beforeArray = content.substring(0, startIndex);
    const afterArray = content.substring(endIndex);
    
    // Extract the array content
    const arrayContent = content.substring(startIndex + 'const MUSEUMS = ['.length, endIndex - 2);
    
    // Split by museum objects - find each complete museum entry
    const museums = [];
    let current = '';
    let braceCount = 0;
    let inString = false;
    let stringChar = null;
    
    for (let i = 0; i < arrayContent.length; i++) {
        const char = arrayContent[i];
        const prevChar = i > 0 ? arrayContent[i - 1] : null;
        
        // Handle string states to avoid parsing inside strings
        if (char === '"' || char === "'" || char === '`') {
            // Count the number of consecutive backslashes before this character
            let backslashCount = 0;
            for (let k = i - 1; k >= 0 && arrayContent[k] === '\\'; k--) {
                backslashCount++;
            }
            if (backslashCount % 2 === 0) { // even number means not escaped
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                    stringChar = null;
                }
            }
        }
        
        current += char;
        
        if (!inString) {
            if (char === '{') {
                if (braceCount === 0 && current.trim().length > 1) {
                    // Start of new museum, but first save any previous
                    const prevContent = current.substring(0, current.length - 1).trim();
                    if (prevContent && prevContent !== ',') {
                        museums.push(prevContent);
                    }
                    current = char;
                }
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                    // End of museum object
                    museums.push(current.trim());
                    current = '';
                    
                    // Skip ahead past any trailing comma and whitespace
                    while (i + 1 < arrayContent.length && /[,\s]/.test(arrayContent[i + 1])) {
                        i++;
                    }
                }
            }
        }
    }
    
    // Add any remaining content
    if (current.trim().length > 0) {
        museums.push(current.trim());
    }
    
    // Filter museums - keep only those not in removal list
    const filteredMuseums = museums.filter((museum, index) => {
        const shouldKeep = !indicesToRemove.includes(index);
        if (!shouldKeep) {
            console.log(`🗑️  Removing index ${index}: ${museum.substring(0, 100)}...`);
        }
        return shouldKeep;
    });
    
    // Reconstruct the array
    const newArrayContent = filteredMuseums.map(museum => {
        // Ensure proper indentation
        return museum.startsWith('    ') ? museum : '    ' + museum.replace(/^\s*/, '');
    }).join(',\n');
    
    return beforeArray + `const MUSEUMS = [\n${newArrayContent}\n];` + afterArray;
}

if (require.main === module) {
    main();
}