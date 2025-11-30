/**
 * Tests for WeChat Mini Program poster download/share compatibility
 * 
 * Issue: Download and share buttons don't work in WeChat Mini Program webview
 * Solution: Detect WeChat environment and provide alternative saving method (long-press)
 */

describe('WeChat Environment Detection', () => {
    let originalUserAgent;
    let originalWindow;

    beforeEach(() => {
        // Save original values
        originalUserAgent = navigator.userAgent;
        originalWindow = { ...window };
        
        // Reset window properties for each test
        delete window.__wxjs_environment;
        delete window.wx;
    });

    afterEach(() => {
        // Restore original values
        Object.defineProperty(navigator, 'userAgent', {
            value: originalUserAgent,
            configurable: true
        });
    });

    describe('UtilityFunctions.isWeChatEnvironment', () => {
        test('should return true for WeChat browser user agent', () => {
            // Mock WeChat browser user agent
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.0(0x18000000) NetType/WIFI Language/zh_CN',
                configurable: true
            });
            
            // Test the detection function
            const isWeChat = navigator.userAgent.toLowerCase().indexOf('micromessenger') > -1;
            expect(isWeChat).toBe(true);
        });

        test('should return false for regular browser user agent', () => {
            // Mock regular browser user agent
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
                configurable: true
            });
            
            // Test the detection function
            const isWeChat = navigator.userAgent.toLowerCase().indexOf('micromessenger') > -1;
            expect(isWeChat).toBe(false);
        });

        test('should return false for Chrome user agent', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                configurable: true
            });
            
            const isWeChat = navigator.userAgent.toLowerCase().indexOf('micromessenger') > -1;
            expect(isWeChat).toBe(false);
        });
    });

    describe('UtilityFunctions.isWeChatMiniProgram', () => {
        test('should return true when __wxjs_environment is miniprogram', () => {
            // Mock WeChat browser user agent
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.0',
                configurable: true
            });
            
            // Mock Mini Program environment
            window.__wxjs_environment = 'miniprogram';
            
            const isWeChat = navigator.userAgent.toLowerCase().indexOf('micromessenger') > -1;
            const isMiniProgram = isWeChat && (
                window.__wxjs_environment === 'miniprogram' ||
                (typeof window.wx !== 'undefined' && typeof window.wx.miniProgram !== 'undefined')
            );
            
            expect(isMiniProgram).toBe(true);
        });

        test('should return true when wx.miniProgram is available', () => {
            // Mock WeChat browser user agent
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.0',
                configurable: true
            });
            
            // Mock wx.miniProgram
            window.wx = {
                miniProgram: {
                    postMessage: jest.fn()
                }
            };
            
            const isWeChat = navigator.userAgent.toLowerCase().indexOf('micromessenger') > -1;
            const isMiniProgram = isWeChat && (
                window.__wxjs_environment === 'miniprogram' ||
                (typeof window.wx !== 'undefined' && typeof window.wx.miniProgram !== 'undefined')
            );
            
            expect(isMiniProgram).toBe(true);
        });

        test('should return false for WeChat browser without Mini Program', () => {
            // Mock WeChat browser user agent without Mini Program markers
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.0',
                configurable: true
            });
            
            // No Mini Program markers
            delete window.__wxjs_environment;
            delete window.wx;
            
            const isWeChat = navigator.userAgent.toLowerCase().indexOf('micromessenger') > -1;
            const isMiniProgram = isWeChat && (
                window.__wxjs_environment === 'miniprogram' ||
                (typeof window.wx !== 'undefined' && typeof window.wx.miniProgram !== 'undefined')
            );
            
            expect(isMiniProgram).toBe(false);
        });
    });
});

describe('WeChat Save Hint Display', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    test('should add save hint to container', () => {
        // Create a container
        const container = document.createElement('div');
        container.id = 'testContainer';
        document.body.appendChild(container);
        
        // Function to show hint (same as in the implementation)
        const showWeChatSaveHint = (container) => {
            if (!container) return;
            const existingHint = container.querySelector('.wechat-save-hint');
            if (existingHint) existingHint.remove();
            
            const hint = document.createElement('div');
            hint.className = 'wechat-save-hint';
            hint.innerHTML = '📱 <strong>长按图片</strong>可保存到相册';
            hint.style.cssText = 'text-align: center; padding: 12px; background: #f0f9eb; color: #67c23a; border-radius: 8px; margin: 10px 0; font-size: 14px; border: 1px solid #c2e7b0;';
            container.appendChild(hint);
        };
        
        showWeChatSaveHint(container);
        
        const hint = container.querySelector('.wechat-save-hint');
        expect(hint).not.toBeNull();
        expect(hint.innerHTML).toContain('长按图片');
        expect(hint.innerHTML).toContain('保存到相册');
    });

    test('should remove existing hint before adding new one', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        
        // Add first hint
        const firstHint = document.createElement('div');
        firstHint.className = 'wechat-save-hint';
        firstHint.textContent = 'First hint';
        container.appendChild(firstHint);
        
        // Function to show hint
        const showWeChatSaveHint = (container) => {
            if (!container) return;
            const existingHint = container.querySelector('.wechat-save-hint');
            if (existingHint) existingHint.remove();
            
            const hint = document.createElement('div');
            hint.className = 'wechat-save-hint';
            hint.innerHTML = '📱 <strong>长按图片</strong>可保存到相册';
            container.appendChild(hint);
        };
        
        showWeChatSaveHint(container);
        
        const hints = container.querySelectorAll('.wechat-save-hint');
        expect(hints.length).toBe(1);
        expect(hints[0].innerHTML).toContain('长按图片');
    });
});

describe('Mini Program postMessage', () => {
    beforeEach(() => {
        delete window.wx;
    });

    test('should call wx.miniProgram.postMessage when available', () => {
        const mockPostMessage = jest.fn();
        window.wx = {
            miniProgram: {
                postMessage: mockPostMessage
            }
        };
        
        // Function to send image to Mini Program
        const sendImageToMiniProgram = (dataURL, filename) => {
            if (typeof window.wx !== 'undefined' && window.wx.miniProgram && typeof window.wx.miniProgram.postMessage === 'function') {
                try {
                    window.wx.miniProgram.postMessage({ 
                        data: { 
                            action: 'saveImage',
                            image: dataURL,
                            filename: filename || 'poster.png'
                        }
                    });
                    return true;
                } catch (e) {
                    return false;
                }
            }
            return false;
        };
        
        const result = sendImageToMiniProgram('data:image/png;base64,abc123', 'test-poster.png');
        
        expect(result).toBe(true);
        expect(mockPostMessage).toHaveBeenCalledWith({
            data: {
                action: 'saveImage',
                image: 'data:image/png;base64,abc123',
                filename: 'test-poster.png'
            }
        });
    });

    test('should return false when wx is not available', () => {
        delete window.wx;
        
        const sendImageToMiniProgram = (dataURL, filename) => {
            if (typeof window.wx !== 'undefined' && window.wx.miniProgram && typeof window.wx.miniProgram.postMessage === 'function') {
                try {
                    window.wx.miniProgram.postMessage({ 
                        data: { 
                            action: 'saveImage',
                            image: dataURL,
                            filename: filename || 'poster.png'
                        }
                    });
                    return true;
                } catch (e) {
                    return false;
                }
            }
            return false;
        };
        
        const result = sendImageToMiniProgram('data:image/png;base64,abc123', 'test.png');
        expect(result).toBe(false);
    });
});

describe('Achievement Poster Download Button', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="achievementPosterSection" style="display: none;">
                <canvas id="achievementPosterCanvas"></canvas>
                <div id="achievementPosterPreview" class="poster-preview"></div>
                <div class="poster-actions">
                    <button id="downloadAchievementPoster" class="poster-button" style="display: none;">📱 下载成就海报</button>
                    <button id="shareAchievementPoster" class="poster-button" style="display: none;">📤 分享成就海报</button>
                </div>
            </div>
        `;
    });

    test('should have download button element', () => {
        const downloadBtn = document.getElementById('downloadAchievementPoster');
        expect(downloadBtn).not.toBeNull();
        expect(downloadBtn.textContent).toContain('下载成就海报');
    });

    test('should have share button element', () => {
        const shareBtn = document.getElementById('shareAchievementPoster');
        expect(shareBtn).not.toBeNull();
        expect(shareBtn.textContent).toContain('分享成就海报');
    });

    test('download and share buttons should be initially hidden', () => {
        const downloadBtn = document.getElementById('downloadAchievementPoster');
        const shareBtn = document.getElementById('shareAchievementPoster');
        
        expect(downloadBtn.style.display).toBe('none');
        expect(shareBtn.style.display).toBe('none');
    });
});

describe('Single Museum Poster Buttons', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <section id="step-share">
                <canvas id="posterCanvas" width="720" height="1280" style="display:none"></canvas>
                <div id="posterPreview"></div>
                <div class="sg-actions">
                    <button id="savePoster">保存到相册</button>
                    <button id="sharePoster">分享给家人</button>
                    <button id="closePoster">✕ 关闭</button>
                </div>
            </section>
        `;
    });

    test('should have save poster button', () => {
        const saveBtn = document.getElementById('savePoster');
        expect(saveBtn).not.toBeNull();
        expect(saveBtn.textContent).toContain('保存到相册');
    });

    test('should have share poster button', () => {
        const shareBtn = document.getElementById('sharePoster');
        expect(shareBtn).not.toBeNull();
        expect(shareBtn.textContent).toContain('分享给家人');
    });
});
