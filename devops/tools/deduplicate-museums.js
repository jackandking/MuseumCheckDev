#!/usr/bin/env node

/**
 * Comprehensive Museum Data Deduplication Tool
 * 
 * This tool systematically removes duplicate museums based on:
 * 1. Exact duplicates (same name AND same ID)
 * 2. Name duplicates (same name, different IDs) - keeps better quality entry
 * 3. Missing data entries (museums without required fields)
 * 
 * Usage: node tools/deduplicate-museums.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_PATH = path.join(__dirname, '..', '..', 'script.js');
const BACKUP_PATH = path.join(__dirname, '..', '..', 'script.js.backup');

function main() {
    const isDryRun = process.argv.includes('--dry-run');
    
    console.log('🔧 Museum Data Deduplication Tool');
    console.log('=====================================\n');
    
    if (isDryRun) {
        console.log('🔍 DRY RUN MODE - No files will be modified\n');
    }
    
    // Read and parse museum data
    let content, museums;
    try {
        content = fs.readFileSync(SCRIPT_PATH, 'utf8');
        const startIndex = content.indexOf('const MUSEUMS = [');
        const endIndex = content.indexOf('];', startIndex) + 2;
        
        if (startIndex === -1 || endIndex === -1) {
            throw new Error('Could not find MUSEUMS array in script.js');
        }
        
        const museumsCode = content.substring(startIndex, endIndex);
        museums = eval(museumsCode.replace('const MUSEUMS = ', ''));
        console.log(`📊 Original museum count: ${museums.length}\n`);
    } catch (error) {
        console.error('❌ Error loading museum data:', error.message);
        process.exit(1);
    }
    
    // Analyze duplicates and issues
    const analysis = analyzeData(museums);
    printAnalysis(analysis);
    
    // Perform deduplication  
    const deduplicatedMuseums = performDeduplication(museums, analysis);
    
    console.log('\n📊 DEDUPLICATION RESULTS');
    console.log('==========================');
    console.log(`Original count: ${museums.length}`);
    console.log(`Final count: ${deduplicatedMuseums.length}`);
    console.log(`Removed: ${museums.length - deduplicatedMuseums.length} entries`);
    
    if (!isDryRun) {
        // Create backup
        fs.copyFileSync(SCRIPT_PATH, BACKUP_PATH);
        console.log(`\n💾 Backup created: ${BACKUP_PATH}`);
        
        // Update the file
        const updatedContent = updateFileContent(content, deduplicatedMuseums);
        fs.writeFileSync(SCRIPT_PATH, updatedContent, 'utf8');
        
        console.log(`✅ Updated ${SCRIPT_PATH}`);
        console.log('\n🚨 IMPORTANT: Run tests to verify data integrity:');
        console.log('npm run test:data-quality');
        console.log('npm run validate-data');
    } else {
        console.log('\n🔍 DRY RUN COMPLETE - No changes made');
        console.log('Run without --dry-run to apply changes');
    }
}

function analyzeData(museums) {
    const analysis = {
        duplicateNames: [],
        duplicateIds: [],
        missingFields: [],
        invalidEntries: []
    };
    
    const nameMap = new Map();
    const idMap = new Map();
    
    museums.forEach((museum, index) => {
        // Check for missing required fields
        if (!museum.name || !museum.location || !museum.description) {
            analysis.missingFields.push({
                index,
                id: museum.id,
                name: museum.name || 'unnamed',
                missingFields: []
            });
            
            if (!museum.name) analysis.missingFields[analysis.missingFields.length - 1].missingFields.push('name');
            if (!museum.location) analysis.missingFields[analysis.missingFields.length - 1].missingFields.push('location');
            if (!museum.description) analysis.missingFields[analysis.missingFields.length - 1].missingFields.push('description');
            
            analysis.invalidEntries.push(index);
            return;
        }
        
        // Check for duplicate names
        if (nameMap.has(museum.name)) {
            const firstIndex = nameMap.get(museum.name);
            analysis.duplicateNames.push({
                name: museum.name,
                indices: [firstIndex, index],
                ids: [museums[firstIndex].id, museum.id],
                keepIndex: selectBetterEntry(museums[firstIndex], museum) === museums[firstIndex] ? firstIndex : index
            });
        } else {
            nameMap.set(museum.name, index);
        }
        
        // Check for duplicate IDs
        if (idMap.has(museum.id)) {
            const firstIndex = idMap.get(museum.id);
            analysis.duplicateIds.push({
                id: museum.id,
                indices: [firstIndex, index],
                names: [museums[firstIndex].name, museum.name],
                keepIndex: selectBetterEntry(museums[firstIndex], museum) === museums[firstIndex] ? firstIndex : index
            });
        } else {
            idMap.set(museum.id, index);
        }
    });
    
    return analysis;
}

function selectBetterEntry(museum1, museum2) {
    // Quality scoring: prioritize completeness and content quality
    
    const score1 = calculateQualityScore(museum1);
    const score2 = calculateQualityScore(museum2);
    
    return score1 >= score2 ? museum1 : museum2;
}

function calculateQualityScore(museum) {
    let score = 0;
    
    // Basic field completeness (40 points max)
    if (museum.name) score += 10;
    if (museum.location) score += 10;
    if (museum.description && museum.description.length > 10) score += 10;
    if (museum.tags && Array.isArray(museum.tags) && museum.tags.length > 0) score += 10;
    
    // Checklist quality (40 points max)
    if (museum.checklists && museum.checklists.parent && museum.checklists.child) {
        const parentComplete = museum.checklists.parent['3-6'] && museum.checklists.parent['7-12'] && museum.checklists.parent['13-18'];
        const childComplete = museum.checklists.child['3-6'] && museum.checklists.child['7-12'] && museum.checklists.child['13-18'];
        
        if (parentComplete) score += 20;
        if (childComplete) score += 20;
    }
    
    // Content richness (20 points max)
    if (museum.description && museum.description.length > 50) score += 10;
    if (museum.image) score += 5;
    if (museum.tags && museum.tags.length > 2) score += 5;
    
    return score;
}

function performDeduplication(museums, analysis) {
    const indicesToRemove = new Set();
    
    // Mark invalid entries for removal
    analysis.invalidEntries.forEach(index => indicesToRemove.add(index));
    
    // Mark duplicate names for removal (keep better quality entry)
    analysis.duplicateNames.forEach(duplicate => {
        duplicate.indices.forEach(index => {
            if (index !== duplicate.keepIndex) {
                indicesToRemove.add(index);
            }
        });
    });
    
    // Mark duplicate IDs for removal (keep better quality entry)  
    analysis.duplicateIds.forEach(duplicate => {
        duplicate.indices.forEach(index => {
            if (index !== duplicate.keepIndex) {
                indicesToRemove.add(index);
            }
        });
    });
    
    // Filter out marked indices
    return museums.filter((museum, index) => !indicesToRemove.has(index));
}

function printAnalysis(analysis) {
    console.log('📋 DUPLICATE ANALYSIS');
    console.log('=====================');
    
    if (analysis.duplicateNames.length > 0) {
        console.log(`\n🏛️  Duplicate Names: ${analysis.duplicateNames.length}`);
        analysis.duplicateNames.forEach(dup => {
            console.log(`  - "${dup.name}"`);
            console.log(`    Keep: Index ${dup.keepIndex} (${dup.ids[dup.indices.indexOf(dup.keepIndex)]})`);
            console.log(`    Remove: Index ${dup.indices.find(i => i !== dup.keepIndex)} (${dup.ids[dup.indices.indexOf(dup.indices.find(i => i !== dup.keepIndex))]})`);
        });
    }
    
    if (analysis.duplicateIds.length > 0) {
        console.log(`\n🆔 Duplicate IDs: ${analysis.duplicateIds.length}`);
        analysis.duplicateIds.forEach(dup => {
            console.log(`  - "${dup.id}"`);
            console.log(`    Keep: Index ${dup.keepIndex} (${dup.names[dup.indices.indexOf(dup.keepIndex)]})`);
            console.log(`    Remove: Index ${dup.indices.find(i => i !== dup.keepIndex)} (${dup.names[dup.indices.indexOf(dup.indices.find(i => i !== dup.keepIndex))]})`);
        });
    }
    
    if (analysis.missingFields.length > 0) {
        console.log(`\n❌ Missing Required Fields: ${analysis.missingFields.length}`);
        analysis.missingFields.forEach(item => {
            console.log(`  - Index ${item.index}: "${item.name}" (${item.id}) missing: ${item.missingFields.join(', ')}`);
        });
    }
    
    console.log(`\n📊 Total entries to remove: ${analysis.invalidEntries.length + analysis.duplicateNames.length + analysis.duplicateIds.length}`);
}

function updateFileContent(content, deduplicatedMuseums) {
    const startIndex = content.indexOf('const MUSEUMS = [');
    const endIndex = content.indexOf('];', startIndex) + 2;
    
    if (startIndex === -1 || endIndex === -1) {
        throw new Error('Could not find MUSEUMS array boundaries');
    }
    
    // Instead of recreating the array, create a simple removal tool
    // Extract the original array and filter out unwanted indices
    const originalCode = content.substring(startIndex, endIndex);
    
    // Create a set of indices to keep
    const originalMuseums = eval(originalCode.replace('const MUSEUMS = ', ''));
    const indicesToRemove = new Set();
    
    // Build removal set based on deduplication results
    const analysis = analyzeData(originalMuseums);
    
    // Mark invalid entries for removal
    analysis.invalidEntries.forEach(index => indicesToRemove.add(index));
    
    // Mark duplicate names for removal (keep better quality entry)
    analysis.duplicateNames.forEach(duplicate => {
        duplicate.indices.forEach(index => {
            if (index !== duplicate.keepIndex) {
                indicesToRemove.add(index);
            }
        });
    });
    
    // Mark duplicate IDs for removal (keep better quality entry)  
    analysis.duplicateIds.forEach(duplicate => {
        duplicate.indices.forEach(index => {
            if (index !== duplicate.keepIndex) {
                indicesToRemove.add(index);
            }
        });
    });
    
    // Extract individual museum objects from original code
    const museumStrings = extractMuseumStrings(originalCode);
    const keepMuseums = museumStrings.filter((_, index) => !indicesToRemove.has(index));
    
    // Reconstruct the array
    const newMuseumsCode = `const MUSEUMS = [\n${keepMuseums.join(',\n')}\n];`;
    
    // Replace the old array with the new one
    const beforeArray = content.substring(0, startIndex);
    const afterArray = content.substring(endIndex);
    
    return beforeArray + newMuseumsCode + afterArray;
}

function extractMuseumStrings(originalCode) {
    // Extract the array content without the const declaration
    const arrayContent = originalCode.replace(/^const MUSEUMS = \[\s*/, '').replace(/\s*\];?\s*$/, '');
    
    // Split by museum objects (each starts with '{')
    const museums = [];
    let current = '';
    let braceCount = 0;
    let inString = false;
    let stringChar = null;
    
    for (let i = 0; i < arrayContent.length; i++) {
        const char = arrayContent[i];
        const prevChar = i > 0 ? arrayContent[i - 1] : null;
        
        // Handle string states
        // Check if the quote is not escaped by counting preceding backslashes
        if (char === '"' || char === "'" || char === '`') {
            // Count consecutive backslashes before this character
            let backslashCount = 0;
            for (let j = i - 1; j >= 0 && arrayContent[j] === '\\'; j--) {
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
        
        if (!inString) {
            if (char === '{') {
                if (braceCount === 0 && current.trim().length > 0) {
                    // Start of new museum, save previous if exists
                    museums.push(current.trim().replace(/,$/, ''));
                    current = '';
                }
                braceCount++;
            } else if (char === '}') {
                braceCount--;
            }
        }
        
        current += char;
        
        // When we finish a complete museum object
        if (!inString && braceCount === 0 && char === '}') {
            museums.push('    ' + current.trim().replace(/,$/, ''));
            current = '';
            // Skip ahead past any trailing comma and whitespace
            while (i + 1 < arrayContent.length && /[,\s]/.test(arrayContent[i + 1])) {
                i++;
            }
        }
    }
    
    // Add any remaining content
    if (current.trim().length > 0) {
        museums.push(current.trim().replace(/,$/, ''));
    }
    
    return museums.filter(m => m.trim().length > 0);
}

if (require.main === module) {
    main();
}

module.exports = { analyzeData, performDeduplication, selectBetterEntry, calculateQualityScore };