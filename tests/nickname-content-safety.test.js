/**
 * Test suite for nickname content safety validation
 * Ensures compliance with China's internet regulations
 */

describe('Nickname Content Safety Validation', () => {
    let app;

    beforeEach(() => {
        testUtils.setupMinimalDOM();
        // Create a new app instance for each test
        app = new MuseumCheckApp();
    });

    describe('Valid Nicknames', () => {
        test('should accept simple Chinese nicknames', () => {
            const result = app.validateNickname('小明');
            expect(result.isValid).toBe(true);
        });

        test('should accept simple English nicknames', () => {
            const result = app.validateNickname('Tom');
            expect(result.isValid).toBe(true);
        });

        test('should accept mixed Chinese-English nicknames', () => {
            const result = app.validateNickname('小Tom');
            expect(result.isValid).toBe(true);
        });

        test('should accept nicknames with numbers', () => {
            const result = app.validateNickname('小明123');
            expect(result.isValid).toBe(true);
        });

        test('should accept friendly child nicknames', () => {
            const friendlyNames = ['宝贝', '小可爱', '阳光', '快乐', '聪明', 'Happy', 'Star'];
            friendlyNames.forEach(name => {
                const result = app.validateNickname(name);
                expect(result.isValid).toBe(true);
            });
        });

        test('should accept museum-themed nicknames', () => {
            const museumNames = ['博物迷', '文物控', '探险家', '小历史'];
            museumNames.forEach(name => {
                const result = app.validateNickname(name);
                expect(result.isValid).toBe(true);
            });
        });
    });

    describe('Blocked Content - Vulgar Language', () => {
        test('should block vulgar Chinese words', () => {
            const vulgarWords = ['傻逼', '傻b'];
            vulgarWords.forEach(word => {
                const result = app.validateNickname(word);
                expect(result.isValid).toBe(false);
                expect(result.message).toContain('不适当内容');
            });
        });

        test('should block vulgar English words', () => {
            const vulgarWords = ['fuck', 'shit', 'bitch'];
            vulgarWords.forEach(word => {
                const result = app.validateNickname(word);
                expect(result.isValid).toBe(false);
                expect(result.message).toContain('不适当内容');
            });
        });

        test('should block vulgar content in mixed nicknames', () => {
            const result = app.validateNickname('小明fuck');
            expect(result.isValid).toBe(false);
        });
    });

    describe('Blocked Content - Political Sensitivity', () => {
        test('should block politically sensitive Chinese terms', () => {
            const politicalTerms = ['反共', '反党', '台独'];
            politicalTerms.forEach(term => {
                const result = app.validateNickname(term);
                expect(result.isValid).toBe(false);
                expect(result.message).toContain('不适当内容');
            });
        });
    });

    describe('Blocked Content - Violence and Illegal', () => {
        test('should block violence-related terms', () => {
            const violentTerms = ['杀人', '恐怖'];
            violentTerms.forEach(term => {
                const result = app.validateNickname(term);
                expect(result.isValid).toBe(false);
            });
        });

        test('should block illegal content references', () => {
            const illegalTerms = ['毒品', '赌博'];
            illegalTerms.forEach(term => {
                const result = app.validateNickname(term);
                expect(result.isValid).toBe(false);
            });
        });
    });

    describe('Circumvention Attempts', () => {
        test('should block leetspeak variations', () => {
            const leetVariations = ['f4ck', 'sh1t', 'b1tch'];
            leetVariations.forEach(word => {
                const result = app.validateNickname(word);
                expect(result.isValid).toBe(false);
            });
        });

        test('should block abbreviations like sb', () => {
            const result = app.validateNickname('sb');
            expect(result.isValid).toBe(false);
        });

        test('should block excessive special characters', () => {
            const result = app.validateNickname('!!!###');
            expect(result.isValid).toBe(false);
            expect(result.message).toContain('特殊字符');
        });
    });

    describe('checkNicknameContentSafety Method', () => {
        test('should return valid for null input', () => {
            const result = app.checkNicknameContentSafety(null);
            expect(result.isValid).toBe(true);
        });

        test('should return valid for empty string', () => {
            const result = app.checkNicknameContentSafety('');
            // Empty string is considered safe at the content level
            // Length validation is handled separately in validateNickname
            expect(result.isValid).toBe(true);
        });

        test('should be case-insensitive for English', () => {
            const result1 = app.checkNicknameContentSafety('FUCK');
            const result2 = app.checkNicknameContentSafety('fuck');
            const result3 = app.checkNicknameContentSafety('Fuck');
            
            expect(result1.isValid).toBe(false);
            expect(result2.isValid).toBe(false);
            expect(result3.isValid).toBe(false);
        });

        test('should ignore whitespace in content check', () => {
            const result = app.checkNicknameContentSafety('f u c k');
            expect(result.isValid).toBe(false);
        });
    });

    describe('Length Validation (existing)', () => {
        test('should reject empty nicknames', () => {
            const result = app.validateNickname('');
            expect(result.isValid).toBe(false);
            expect(result.message).toContain('不能为空');
        });

        test('should reject whitespace-only nicknames', () => {
            const result = app.validateNickname('   ');
            expect(result.isValid).toBe(false);
        });

        test('should reject overly long nicknames', () => {
            const result = app.validateNickname('这是一个非常长的昵称');
            expect(result.isValid).toBe(false);
            expect(result.message).toContain('过长');
        });

        test('should accept max-length Chinese nicknames', () => {
            // 5 Chinese characters is the max (10 units)
            const result = app.validateNickname('博物小探');
            expect(result.isValid).toBe(true);
        });

        test('should accept max-length English nicknames', () => {
            // 10 English characters is the max
            const result = app.validateNickname('MuseumKid');
            expect(result.isValid).toBe(true);
        });
    });

    describe('Error Message Quality', () => {
        test('should provide Chinese error messages', () => {
            const result = app.validateNickname('fuck');
            expect(result.message).toMatch(/[\u4e00-\u9fa5]/);
        });

        test('should provide helpful guidance', () => {
            const result = app.validateNickname('傻逼');
            expect(result.message).toContain('请更换');
        });

        test('should mention health for content violations', () => {
            const result = app.validateNickname('shit');
            expect(result.message).toContain('健康');
        });
    });
});
