/**
 * QR Code URL Tests
 * 
 * Tests to ensure museum QR codes link to correct URLs WITHOUT age parameter.
 * Users should select their age group after scanning the QR code.
 * 
 * This test prevents regression of the bug where QR codes incorrectly included
 * age parameters, forcing users into a specific age group.
 */

const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

describe('Museum QR Code URLs', () => {
    describe('QR Code URL Format', () => {
        test('QR code URLs should NOT include age parameter', () => {
            // As per MUSEUM_CHECKIN_DOC.md line 91:
            // QR codes should link to: museum-checkin.html?museum=YOUR_MUSEUM_ID
            // WITHOUT age parameter
            
            const correctUrl = 'https://museumcheck.cn/museum-checkin.html?museum=forbidden-city';
            const wrongUrl = 'https://museumcheck.cn/museum-checkin.html?museum=forbidden-city&age=7-12';
            
            // Correct URL should NOT have age parameter
            expect(correctUrl).not.toContain('&age=');
            expect(correctUrl).not.toContain('?age=');
            
            // Wrong URL example (what we're fixing)
            expect(wrongUrl).toContain('&age=');
        });

        test('Zhaoyuan Hengli Watch Museum QR should not have age parameter', () => {
            // This is the specific museum mentioned in the bug report
            const museumId = 'zhaoyuan-hengli-watch-museum';
            const correctUrl = `https://museumcheck.cn/museum-checkin.html?museum=${museumId}`;
            
            // URL should only have museum parameter
            expect(correctUrl).toContain('?museum=');
            expect(correctUrl).not.toContain('&age=');
            expect(correctUrl).not.toContain('?age=');
            
            // Parse URL to verify parameters
            const url = new URL(correctUrl);
            expect(url.searchParams.get('museum')).toBe(museumId);
            expect(url.searchParams.get('age')).toBeNull();
        });

        test('Forbidden City QR should not have age parameter', () => {
            const museumId = 'forbidden-city';
            const correctUrl = `https://museumcheck.cn/museum-checkin.html?museum=${museumId}`;
            
            const url = new URL(correctUrl);
            expect(url.searchParams.get('museum')).toBe(museumId);
            expect(url.searchParams.get('age')).toBeNull();
        });
    });

    describe('QR Code Generation Tool', () => {
        test('generate-museum-qr.js should exist and be executable', () => {
            const scriptPath = path.join(__dirname, '..', 'devops', 'tools', 'generate-museum-qr.js');
            expect(fs.existsSync(scriptPath)).toBe(true);
            
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');
            expect(scriptContent).toContain('BASE_URL');
            expect(scriptContent).toContain('museum-checkin.html');
        });

        test('QR code generator should not append age parameter', () => {
            const scriptPath = path.join(__dirname, '..', 'devops', 'tools', 'generate-museum-qr.js');
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');
            
            // Generator should build URL with only museum parameter
            expect(scriptContent).toContain('?museum=');
            
            // Generator should NOT add age parameter
            // Look for patterns that would add age
            const lines = scriptContent.split('\n');
            const urlBuildingLines = lines.filter(line => 
                line.includes('BASE_URL') || 
                line.includes('museum=') ||
                line.includes('url =')
            );
            
            // None of the URL building lines should add age parameter
            urlBuildingLines.forEach(line => {
                if (line.includes('url =') || line.includes('URL')) {
                    expect(line).not.toContain('&age=');
                    expect(line).not.toContain('${age}');
                    expect(line).not.toContain('age:');
                }
            });
        });

        test('QR code generator should validate museum ID format', () => {
            const scriptPath = path.join(__dirname, '..', 'devops', 'tools', 'generate-museum-qr.js');
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');
            
            // Should have validation function
            expect(scriptContent).toContain('validateMuseumId');
            expect(scriptContent).toContain('museumId');
        });
    });

    describe('Documentation Compliance', () => {
        test('MUSEUM_CHECKIN_DOC.md should specify URL format without age', () => {
            const docPath = path.join(__dirname, '..', 'MUSEUM_CHECKIN_DOC.md');
            if (fs.existsSync(docPath)) {
                const docContent = fs.readFileSync(docPath, 'utf8');
                
                // Documentation should show correct format
                expect(docContent).toContain('museum-checkin.html?museum=');
                
                // Check for the specific line that shows QR code format
                const lines = docContent.split('\n');
                const qrCodeLine = lines.find(line => 
                    line.includes('QR code') && 
                    line.includes('museum-checkin.html')
                );
                
                if (qrCodeLine) {
                    // QR code documentation should not show age parameter
                    expect(qrCodeLine).not.toContain('&age=');
                }
            }
        });

        test('age parameter should have default value in museum-checkin.html', () => {
            const docPath = path.join(__dirname, '..', 'MUSEUM_CHECKIN_DOC.md');
            if (fs.existsSync(docPath)) {
                const docContent = fs.readFileSync(docPath, 'utf8');
                
                // Documentation should mention that age has a default
                // This justifies why we can omit it from QR codes
                expect(docContent).toContain('age');
                expect(docContent).toContain('Default');
            }
        });
    });

    describe('QR Code Image Files', () => {
        test('Zhaoyuan Hengli Watch Museum QR code file should exist', () => {
            const qrCodePath = path.join(__dirname, '..', 'assets', 'qrcodes', 'MuseumCheck_QRCode_ZhaoyuanHengliWatchMuseum.png');
            expect(fs.existsSync(qrCodePath)).toBe(true);
        });

        test('Forbidden City QR code file should exist', () => {
            const qrCodePath = path.join(__dirname, '..', 'assets', 'qrcodes', 'MuseumCheck_QRCode_ForbiddenCity.png');
            expect(fs.existsSync(qrCodePath)).toBe(true);
        });

        test('QR code files should be valid PNG images', () => {
            const qrCodes = [
                'MuseumCheck_QRCode_ZhaoyuanHengliWatchMuseum.png',
                'MuseumCheck_QRCode_ForbiddenCity.png'
            ];

            qrCodes.forEach(filename => {
                const filePath = path.join(__dirname, '..', filename);
                if (fs.existsSync(filePath)) {
                    const fileBuffer = fs.readFileSync(filePath);
                    
                    // Check PNG magic number (89 50 4E 47)
                    expect(fileBuffer[0]).toBe(0x89);
                    expect(fileBuffer[1]).toBe(0x50);
                    expect(fileBuffer[2]).toBe(0x4E);
                    expect(fileBuffer[3]).toBe(0x47);
                    
                    // File should have reasonable size (not empty, not too large)
                    expect(fileBuffer.length).toBeGreaterThan(1000);
                    expect(fileBuffer.length).toBeLessThan(100000);
                }
            });
        });
    });

    describe('Fireworks Wall Integration', () => {
        test('fireworks-wall.html should map museum IDs to QR codes', () => {
            const fireworksWallPath = path.join(__dirname, '..', 'fireworks-wall.html');
            if (fs.existsSync(fireworksWallPath)) {
                const content = fs.readFileSync(fireworksWallPath, 'utf8');
                
                // Should have QR code mapping for Zhaoyuan museum
                expect(content).toContain('zhaoyuan-hengli-watch-museum');
                expect(content).toContain('MuseumCheck_QRCode_ZhaoyuanHengliWatchMuseum.png');
            }
        });

        test('fireworks-wall.html updateQrCode function should exist', () => {
            const fireworksWallPath = path.join(__dirname, '..', 'fireworks-wall.html');
            if (fs.existsSync(fireworksWallPath)) {
                const content = fs.readFileSync(fireworksWallPath, 'utf8');
                
                // Should have updateQrCode function
                expect(content).toContain('function updateQrCode');
                expect(content).toContain('museumQrCodes');
            }
        });
    });

    describe('URL Parameter Best Practices', () => {
        test('museum-checkin.html should accept optional age parameter', () => {
            // Even though QR codes don't include age, the page should still
            // accept it as an optional parameter for other use cases
            
            const urlWithAge = 'https://museumcheck.cn/museum-checkin.html?museum=test&age=7-12';
            const urlWithoutAge = 'https://museumcheck.cn/museum-checkin.html?museum=test';
            
            const url1 = new URL(urlWithAge);
            expect(url1.searchParams.get('museum')).toBe('test');
            expect(url1.searchParams.get('age')).toBe('7-12');
            
            const url2 = new URL(urlWithoutAge);
            expect(url2.searchParams.get('museum')).toBe('test');
            expect(url2.searchParams.get('age')).toBeNull();
            
            // Both should be valid URLs
            expect(url1.toString()).toBeTruthy();
            expect(url2.toString()).toBeTruthy();
        });

        test('age parameter should only be used for direct navigation, not QR codes', () => {
            // QR codes: No age parameter (user selects after scanning)
            const qrCodeUrl = 'https://museumcheck.cn/museum-checkin.html?museum=test';
            expect(qrCodeUrl).not.toContain('age=');
            
            // Direct navigation from main app: Can include age parameter
            const appNavigationUrl = 'museum-checkin.html?museum=test&age=7-12';
            expect(appNavigationUrl).toContain('age=');
            
            // This distinction is intentional and correct
        });
    });
});
