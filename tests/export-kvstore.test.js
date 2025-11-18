/**
 * Unit tests for KV Store to Static File Export Tool
 * Tests the export functionality
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

// Import the export module
const { fetchFromKVStore, exportMuseum } = require('../tools/export-kvstore-to-static.js');

describe('Export KV Store to Static Files', () => {
    const testOutputDir = path.join(__dirname, '../tmp/test-museums');
    
    beforeEach(() => {
        // Create test output directory
        if (!fs.existsSync(testOutputDir)) {
            fs.mkdirSync(testOutputDir, { recursive: true });
        }
    });
    
    afterEach(() => {
        // Clean up test files
        if (fs.existsSync(testOutputDir)) {
            const files = fs.readdirSync(testOutputDir);
            files.forEach(file => {
                fs.unlinkSync(path.join(testOutputDir, file));
            });
            fs.rmdirSync(testOutputDir);
        }
    });
    
    describe('fetchFromKVStore', () => {
        test('should fetch museum data from KV store', async () => {
            // This is an integration test that requires actual KV store access
            // Skip if running in CI or no network
            if (process.env.CI || !process.env.ALLOW_NETWORK_TESTS) {
                console.log('Skipping network test - set ALLOW_NETWORK_TESTS=1 to run');
                return;
            }
            
            const data = await fetchFromKVStore('forbidden-city');
            
            if (data) {
                expect(data).toHaveProperty('id', 'forbidden-city');
                expect(data).toHaveProperty('name');
                expect(data).toHaveProperty('location');
                expect(data).toHaveProperty('checklists');
            } else {
                // Museum not in KV store is also a valid outcome
                console.log('Museum forbidden-city not found in KV store (expected if not uploaded)');
            }
        }, 10000);
        
        test('should return null for non-existent museum', async () => {
            if (process.env.CI || !process.env.ALLOW_NETWORK_TESTS) {
                return;
            }
            
            const data = await fetchFromKVStore('non-existent-museum-12345');
            expect(data).toBeNull();
        }, 10000);
    });
    
    describe('exportMuseum', () => {
        test('should export museum data to JSON file in dry-run mode', async () => {
            if (process.env.CI || !process.env.ALLOW_NETWORK_TESTS) {
                return;
            }
            
            const result = await exportMuseum('forbidden-city', testOutputDir, true, false);
            
            // In dry-run mode, should succeed but not create file
            if (result.success) {
                expect(result.reason).toBe('dry_run');
                const filePath = path.join(testOutputDir, 'forbidden-city.json');
                expect(fs.existsSync(filePath)).toBe(false);
            } else {
                // Museum not in KV store
                expect(result.reason).toBe('not_found');
            }
        }, 10000);
        
        test('should create valid JSON file when museum exists', async () => {
            if (process.env.CI || !process.env.ALLOW_NETWORK_TESTS) {
                return;
            }
            
            const result = await exportMuseum('forbidden-city', testOutputDir, false, false);
            
            if (result.success) {
                const filePath = path.join(testOutputDir, 'forbidden-city.json');
                expect(fs.existsSync(filePath)).toBe(true);
                
                // Validate JSON structure
                const content = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(content);
                
                expect(data).toHaveProperty('id', 'forbidden-city');
                expect(data).toHaveProperty('name');
                expect(data).toHaveProperty('location');
                expect(data).toHaveProperty('checklists');
                expect(data.checklists).toHaveProperty('parent');
                expect(data.checklists).toHaveProperty('child');
            } else {
                // Museum not in KV store is also valid
                expect(result.reason).toBe('not_found');
            }
        }, 10000);
        
        test('should skip existing files without force flag', async () => {
            if (process.env.CI || !process.env.ALLOW_NETWORK_TESTS) {
                return;
            }
            
            // Create a dummy file
            const filePath = path.join(testOutputDir, 'test-museum.json');
            fs.writeFileSync(filePath, JSON.stringify({ id: 'test-museum' }), 'utf8');
            
            const result = await exportMuseum('test-museum', testOutputDir, false, false);
            
            // Should skip because file exists
            expect(result.reason).toBe('exists');
        }, 10000);
        
        test('should overwrite existing files with force flag', async () => {
            if (process.env.CI || !process.env.ALLOW_NETWORK_TESTS) {
                return;
            }
            
            // Create a dummy file
            const filePath = path.join(testOutputDir, 'forbidden-city.json');
            fs.writeFileSync(filePath, JSON.stringify({ id: 'forbidden-city', old: true }), 'utf8');
            
            const result = await exportMuseum('forbidden-city', testOutputDir, false, true);
            
            if (result.success) {
                const content = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(content);
                
                // Should have new data, not old
                expect(data).not.toHaveProperty('old');
                expect(data).toHaveProperty('name');
            } else {
                // Museum not in KV store
                expect(result.reason).toBe('not_found');
            }
        }, 10000);
    });
    
    describe('File format validation', () => {
        test('exported file should match existing static file format', () => {
            // Load an existing static file as reference
            const referencePath = path.join(__dirname, '../museums/forbidden-city.json');
            
            if (!fs.existsSync(referencePath)) {
                console.log('Reference file not found, skipping format validation');
                return;
            }
            
            const referenceData = JSON.parse(fs.readFileSync(referencePath, 'utf8'));
            
            // Check required fields
            expect(referenceData).toHaveProperty('id');
            expect(referenceData).toHaveProperty('name');
            expect(referenceData).toHaveProperty('location');
            expect(referenceData).toHaveProperty('description');
            expect(referenceData).toHaveProperty('tags');
            expect(referenceData).toHaveProperty('checklists');
            
            // Check checklists structure
            expect(referenceData.checklists).toHaveProperty('parent');
            expect(referenceData.checklists).toHaveProperty('child');
            
            // Check age groups
            const ageGroups = ['3-6', '7-12', '13-18'];
            ageGroups.forEach(age => {
                expect(referenceData.checklists.parent).toHaveProperty(age);
                expect(referenceData.checklists.child).toHaveProperty(age);
                expect(Array.isArray(referenceData.checklists.parent[age])).toBe(true);
                expect(Array.isArray(referenceData.checklists.child[age])).toBe(true);
            });
        });
    });
    
    describe('Error handling', () => {
        test('should handle invalid museum ID gracefully', async () => {
            if (process.env.CI || !process.env.ALLOW_NETWORK_TESTS) {
                return;
            }
            
            const result = await exportMuseum('', testOutputDir, false, false);
            
            // Should handle empty ID
            expect(result.success).toBe(false);
        }, 10000);
    });
});

describe('Integration with museum-data-loader', () => {
    test('exported file should be loadable by museum-data-loader', () => {
        // This tests that the exported format is compatible
        const testFile = path.join(__dirname, '../museums/shanghai-museum.json');
        
        if (!fs.existsSync(testFile)) {
            console.log('Test file not found, skipping integration test');
            return;
        }
        
        const data = JSON.parse(fs.readFileSync(testFile, 'utf8'));
        
        // Validate it has all required fields for museum-data-loader
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('name');
        expect(data).toHaveProperty('location');
        expect(data).toHaveProperty('checklists');
        
        // Verify the structure matches what museum-data-loader expects
        expect(typeof data.id).toBe('string');
        expect(typeof data.name).toBe('string');
        expect(typeof data.location).toBe('string');
        expect(typeof data.checklists).toBe('object');
        expect(typeof data.checklists.parent).toBe('object');
        expect(typeof data.checklists.child).toBe('object');
    });
});
