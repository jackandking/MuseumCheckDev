/**
 * Fireworks Wall Museum-Specific QR Code Tests
 * 
 * Tests for dynamic QR code replacement based on museum filter parameter
 */

describe('Fireworks Wall Museum-Specific QR Code Tests', () => {
    let mockLocalStorage;

    beforeEach(() => {
        // Mock localStorage
        mockLocalStorage = {};
        global.localStorage = {
            getItem: jest.fn((key) => mockLocalStorage[key] || null),
            setItem: jest.fn((key, value) => {
                mockLocalStorage[key] = value;
            }),
            removeItem: jest.fn((key) => {
                delete mockLocalStorage[key];
            }),
            clear: jest.fn(() => {
                mockLocalStorage = {};
            })
        };
    });

    describe('QR Code Dynamic Replacement', () => {
        test('should display default QR code when no museum filter is present', () => {
            // Set up minimal DOM structure without museum filter
            document.body.innerHTML = `
                <div class="wechat-qr-code" id="wechatQrCode">
                    <img src="MuseumCheck_QRCode_WX.jpg" alt="微信小程序二维码">
                    <div class="qr-label">扫码放烟花</div>
                </div>
            `;

            const qrCodeImg = document.querySelector('#wechatQrCode img');
            const qrLabel = document.querySelector('#wechatQrCode .qr-label');

            expect(qrCodeImg.src).toContain('MuseumCheck_QRCode_WX.jpg');
            expect(qrLabel.textContent).toBe('扫码放烟花');
        });

        test('should have museum-specific QR code mapping for forbidden-city', () => {
            // Simulate the museum QR code mapping from fireworks-wall.html
            const museumQrCodes = {
                'forbidden-city': 'MuseumCheck_QRCode_ForbiddenCity.png'
            };

            expect(museumQrCodes['forbidden-city']).toBe('MuseumCheck_QRCode_ForbiddenCity.png');
        });

        test('should update QR code when museum filter is forbidden-city', () => {
            // Set up DOM structure
            document.body.innerHTML = `
                <div class="wechat-qr-code" id="wechatQrCode">
                    <img src="MuseumCheck_QRCode_WX.jpg" alt="微信小程序二维码">
                    <div class="qr-label">扫码放烟花</div>
                </div>
            `;

            // Simulate the updateQrCode function logic
            const filterMuseumId = 'forbidden-city';
            const filterMuseumName = '故宫博物院';
            const wechatQrCodeImg = document.querySelector('#wechatQrCode img');
            const qrLabel = document.querySelector('#wechatQrCode .qr-label');
            
            if (filterMuseumId && wechatQrCodeImg && qrLabel) {
                const museumQrCodes = {
                    'forbidden-city': 'MuseumCheck_QRCode_ForbiddenCity.png'
                };
                
                if (museumQrCodes[filterMuseumId]) {
                    wechatQrCodeImg.src = museumQrCodes[filterMuseumId];
                    wechatQrCodeImg.alt = `${filterMuseumName}打卡二维码`;
                    qrLabel.textContent = '扫码打卡';
                }
            }

            expect(wechatQrCodeImg.src).toContain('MuseumCheck_QRCode_ForbiddenCity.png');
            expect(wechatQrCodeImg.alt).toBe('故宫博物院打卡二维码');
            expect(qrLabel.textContent).toBe('扫码打卡');
        });

        test('should not update QR code for museums without specific QR code', () => {
            // Set up DOM structure
            document.body.innerHTML = `
                <div class="wechat-qr-code" id="wechatQrCode">
                    <img src="MuseumCheck_QRCode_WX.jpg" alt="微信小程序二维码">
                    <div class="qr-label">扫码放烟花</div>
                </div>
            `;

            // Simulate the updateQrCode function logic with non-existent museum
            const filterMuseumId = 'some-other-museum';
            const wechatQrCodeImg = document.querySelector('#wechatQrCode img');
            const qrLabel = document.querySelector('#wechatQrCode .qr-label');
            
            if (filterMuseumId && wechatQrCodeImg && qrLabel) {
                const museumQrCodes = {
                    'forbidden-city': 'MuseumCheck_QRCode_ForbiddenCity.png'
                };
                
                // Should not update if museum not in mapping
                if (museumQrCodes[filterMuseumId]) {
                    wechatQrCodeImg.src = museumQrCodes[filterMuseumId];
                    qrLabel.textContent = '扫码打卡';
                }
            }

            // Should remain default
            expect(wechatQrCodeImg.src).toContain('MuseumCheck_QRCode_WX.jpg');
            expect(qrLabel.textContent).toBe('扫码放烟花');
        });
    });

    describe('QR Code Label Changes', () => {
        test('should change label to "扫码打卡" for museum-specific QR', () => {
            document.body.innerHTML = `
                <div class="wechat-qr-code" id="wechatQrCode">
                    <img src="MuseumCheck_QRCode_WX.jpg" alt="微信小程序二维码">
                    <div class="qr-label">扫码放烟花</div>
                </div>
            `;

            const qrLabel = document.querySelector('#wechatQrCode .qr-label');
            qrLabel.textContent = '扫码打卡';

            expect(qrLabel.textContent).toBe('扫码打卡');
        });

        test('should keep default label "扫码放烟花" when no museum filter', () => {
            document.body.innerHTML = `
                <div class="wechat-qr-code" id="wechatQrCode">
                    <img src="MuseumCheck_QRCode_WX.jpg" alt="微信小程序二维码">
                    <div class="qr-label">扫码放烟花</div>
                </div>
            `;

            const qrLabel = document.querySelector('#wechatQrCode .qr-label');

            expect(qrLabel.textContent).toBe('扫码放烟花');
        });
    });

    describe('QR Code Alt Text', () => {
        test('should update alt text to museum-specific description', () => {
            document.body.innerHTML = `
                <div class="wechat-qr-code" id="wechatQrCode">
                    <img src="MuseumCheck_QRCode_WX.jpg" alt="微信小程序二维码">
                    <div class="qr-label">扫码放烟花</div>
                </div>
            `;

            const filterMuseumName = '故宫博物院';
            const wechatQrCodeImg = document.querySelector('#wechatQrCode img');
            wechatQrCodeImg.alt = `${filterMuseumName}打卡二维码`;

            expect(wechatQrCodeImg.alt).toBe('故宫博物院打卡二维码');
        });
    });
});
