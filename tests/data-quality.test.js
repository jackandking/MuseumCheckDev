/**
 * Data Quality Tests
 * 
 * These tests ensure systematic data quality issues are caught
 * before they affect the user experience. MANDATORY for all
 * museum data changes.
 */

const fs = require('fs');
const path = require('path');

describe('Museum Data Quality', () => {
    let museums;
    
    beforeAll(() => {
        // Load museum data from museums-data.js (new structure) or script.js (legacy)
        const scriptPath = path.join(__dirname, '..', 'script.js');
        const museumsDataPath = path.join(__dirname, '..', 'museums-data.js');
        
        let content;
        if (fs.existsSync(museumsDataPath)) {
            content = fs.readFileSync(museumsDataPath, 'utf8');
        } else {
            content = fs.readFileSync(scriptPath, 'utf8');
        }
        
        const startIndex = content.indexOf('const MUSEUMS = [');
        const endIndex = content.indexOf('];', startIndex) + 2;
        
        expect(startIndex).not.toBe(-1);
        expect(endIndex).not.toBe(-1);
        
        const museumsCode = content.substring(startIndex, endIndex);
        museums = eval(museumsCode.replace('const MUSEUMS = ', ''));
        
        expect(museums).toBeDefined();
        expect(Array.isArray(museums)).toBe(true);
    });

    test('should have no duplicate museum names', () => {
        const names = new Map();
        const duplicates = [];
        
        museums.forEach((museum, index) => {
            if (names.has(museum.name)) {
                duplicates.push({
                    name: museum.name,
                    firstIndex: names.get(museum.name),
                    duplicateIndex: index,
                    firstId: museums[names.get(museum.name)].id,
                    duplicateId: museum.id
                });
            } else {
                names.set(museum.name, index);
            }
        });
        
        if (duplicates.length > 0) {
            console.error('Duplicate museum names found:');
            duplicates.forEach(dup => {
                console.error(`  - "${dup.name}" at indices ${dup.firstIndex} (${dup.firstId}) and ${dup.duplicateIndex} (${dup.duplicateId})`);
            });
        }
        
        expect(duplicates).toHaveLength(0);
    });

    test('should have no duplicate museum IDs', () => {
        const ids = new Map();
        const duplicates = [];
        
        museums.forEach((museum, index) => {
            if (ids.has(museum.id)) {
                duplicates.push({
                    id: museum.id,
                    firstIndex: ids.get(museum.id),
                    duplicateIndex: index,
                    firstName: museums[ids.get(museum.id)].name,
                    duplicateName: museum.name
                });
            } else {
                ids.set(museum.id, index);
            }
        });
        
        if (duplicates.length > 0) {
            console.error('Duplicate museum IDs found:');
            duplicates.forEach(dup => {
                console.error(`  - "${dup.id}" at indices ${dup.firstIndex} (${dup.firstName}) and ${dup.duplicateIndex} (${dup.duplicateName})`);
            });
        }
        
        expect(duplicates).toHaveLength(0);
    });

    test('should have no undefined or null museum names', () => {
        const invalidNames = [];
        
        museums.forEach((museum, index) => {
            if (!museum.name || museum.name === undefined || museum.name === null) {
                invalidNames.push({
                    index,
                    id: museum.id,
                    name: museum.name
                });
            }
        });
        
        if (invalidNames.length > 0) {
            console.error('Museums with invalid names found:');
            invalidNames.forEach(invalid => {
                console.error(`  - Index ${invalid.index}: ID "${invalid.id}", name: ${invalid.name}`);
            });
        }
        
        expect(invalidNames).toHaveLength(0);
    });

    test('should have all required fields for each museum', () => {
        const requiredFields = ['id', 'name', 'location', 'description', 'tags'];
        const missingFields = [];
        
        museums.forEach((museum, index) => {
            const missing = requiredFields.filter(field => !museum[field] || museum[field] === undefined);
            if (missing.length > 0) {
                missingFields.push({
                    index,
                    name: museum.name || 'unnamed',
                    id: museum.id || 'no-id',
                    missingFields: missing
                });
            }
        });
        
        if (missingFields.length > 0) {
            console.error('Museums with missing required fields found:');
            missingFields.forEach(item => {
                console.error(`  - "${item.name}" (${item.id}) at index ${item.index}: missing ${item.missingFields.join(', ')}`);
            });
        }
        
        expect(missingFields).toHaveLength(0);
    });

    test('should have proper checklist structure for all museums', () => {
        const ageGroups = ['3-6', '7-12', '13-18'];
        const checklistTypes = ['parent', 'child'];
        const invalidStructures = [];
        
        museums.forEach((museum, index) => {
            if (!museum.checklists) {
                invalidStructures.push({
                    index,
                    name: museum.name,
                    issue: 'missing checklists object'
                });
                return;
            }
            
            checklistTypes.forEach(type => {
                if (!museum.checklists[type]) {
                    invalidStructures.push({
                        index,
                        name: museum.name,
                        issue: `missing ${type} checklists`
                    });
                    return;
                }
                
                ageGroups.forEach(age => {
                    if (!museum.checklists[type][age] || !Array.isArray(museum.checklists[type][age])) {
                        invalidStructures.push({
                            index,
                            name: museum.name,
                            issue: `missing or invalid ${type} checklist for age ${age}`
                        });
                    }
                });
            });
        });
        
        if (invalidStructures.length > 0) {
            console.error('Museums with invalid checklist structures found:');
            invalidStructures.forEach(item => {
                console.error(`  - "${item.name}" at index ${item.index}: ${item.issue}`);
            });
        }
        
        expect(invalidStructures).toHaveLength(0);
    });

    test('should have expected museum count (after systematic deduplication)', () => {
        // After comprehensive deduplication (v4.7.0):
        // - Removed 45 duplicate/invalid entries (40 duplicate names + 24 duplicate IDs + 3 missing data)
        // - Final count: 258 high-quality unique museums (including Huzhou Science and Technology Museum)
        // - After adding Li Shutong Memorial Hall (Pinghu): 259 museums
        // - After adding Zhaoyuan Hengli Clock Museum: 260 museums
        
        console.log(`Current museum count: ${museums.length}`);
        
        // Exact count after systematic deduplication
        expect(museums.length).toBe(260);
        
        // Validate that this is within reasonable operational range
        expect(museums.length).toBeGreaterThan(200);
        expect(museums.length).toBeLessThan(300);
    });

    describe('Data Consistency Checks', () => {
        test('should have consistent Chinese text encoding', () => {
            const encodingIssues = [];
            
            museums.forEach((museum, index) => {
                // Check for common encoding issues in Chinese text
                const chineseFields = [museum.name, museum.location, museum.description];
                
                chineseFields.forEach((field, fieldIndex) => {
                    if (field && typeof field === 'string') {
                        // Check for garbled characters or encoding issues
                        if (field.includes('�') || field.includes('????')) {
                            encodingIssues.push({
                                index,
                                name: museum.name,
                                field: fieldIndex === 0 ? 'name' : fieldIndex === 1 ? 'location' : 'description',
                                value: field
                            });
                        }
                    }
                });
            });
            
            if (encodingIssues.length > 0) {
                console.error('Text encoding issues found:');
                encodingIssues.forEach(issue => {
                    console.error(`  - "${issue.name}" at index ${issue.index}: ${issue.field} has encoding issues`);
                });
            }
            
            expect(encodingIssues).toHaveLength(0);
        });

        test('should have valid tags for all museums', () => {
            const invalidTags = [];
            
            museums.forEach((museum, index) => {
                if (!museum.tags || !Array.isArray(museum.tags) || museum.tags.length === 0) {
                    invalidTags.push({
                        index,
                        name: museum.name,
                        tags: museum.tags
                    });
                }
            });
            
            if (invalidTags.length > 0) {
                console.error('Museums with invalid tags found:');
                invalidTags.forEach(item => {
                    console.error(`  - "${item.name}" at index ${item.index}: tags = ${JSON.stringify(item.tags)}`);
                });
            }
            
            expect(invalidTags).toHaveLength(0);
        });
    });

    describe('User Experience Impact', () => {
        test('should not have confusing similar names that could cause user errors', () => {
            const similarNames = [];
            
            museums.forEach((museum1, index1) => {
                museums.forEach((museum2, index2) => {
                    if (index1 >= index2) return; // Avoid duplicate comparisons
                    
                    // Check for very similar names that could confuse users
                    if (museum1.name && museum2.name) {
                        const name1 = museum1.name.replace(/[^\u4e00-\u9fa5]/g, ''); // Only Chinese chars
                        const name2 = museum2.name.replace(/[^\u4e00-\u9fa5]/g, ''); 
                        
                        // If names are very similar (substring relationship)
                        if (name1.length > 3 && name2.length > 3) {
                            if (name1.includes(name2) || name2.includes(name1)) {
                                const ratio = Math.min(name1.length, name2.length) / Math.max(name1.length, name2.length);
                                if (ratio > 0.8) { // 80% similarity
                                    similarNames.push({
                                        name1: museum1.name,
                                        name2: museum2.name,
                                        index1,
                                        index2,
                                        id1: museum1.id,
                                        id2: museum2.id
                                    });
                                }
                            }
                        }
                    }
                });
            });
            
            if (similarNames.length > 0) {
                console.warn('Potentially confusing similar museum names found:');
                similarNames.forEach(item => {
                    console.warn(`  - "${item.name1}" (${item.id1}) vs "${item.name2}" (${item.id2})`);
                });
            }
            
            // This is a warning, not an error, but should be reviewed
            expect(similarNames.length).toBeLessThan(5); // Allow some reasonable similarity
        });
    });
});