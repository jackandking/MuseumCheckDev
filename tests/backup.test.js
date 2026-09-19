/**
 * backup.js 单元测试
 * 覆盖：导出封包、denylist 排除、导入恢复、损坏码报错、URL-safe base64 容错。
 */
const Backup = require('../js/backup.js');

beforeEach(() => {
    localStorage.clear();
});

describe('exportSaveCode', () => {
    test('返回非空字符串且可解析为 v:1 封包', () => {
        localStorage.setItem('childNickname', '朵朵');
        const code = Backup.exportSaveCode();
        expect(typeof code).toBe('string');
        expect(code.length).toBeGreaterThan(0);
        const payload = JSON.parse(Backup.base64ToUtf8(code));
        expect(payload.v).toBe(1);
        expect(payload.app).toBe('museumcheck');
        expect(typeof payload.data).toBe('object');
        expect(payload.data.childNickname).toBe('朵朵');
    });

    test('排除敏感/噪声 key（denylist）', () => {
        localStorage.setItem('user_id', 'u-123');
        localStorage.setItem('childNickname', '朵朵');
        localStorage.setItem('deepseekApiKey', 'SECRET_KEY');
        localStorage.setItem('letmetry_api_key', 'SECRET_KEY');
        localStorage.setItem('test_key1', '1');
        localStorage.setItem('mc_debug', '1');

        const payload = JSON.parse(Backup.base64ToUtf8(Backup.exportSaveCode()));
        expect(payload.data.user_id).toBe('u-123');
        expect(payload.data.childNickname).toBe('朵朵');
        expect(payload.data.deepseekApiKey).toBeUndefined();
        expect(payload.data.letmetry_api_key).toBeUndefined();
        expect(payload.data.test_key1).toBeUndefined();
        expect(payload.data.mc_debug).toBeUndefined();
    });

    test('中文 / Unicode 内容可正确往返', () => {
        localStorage.setItem('childNickname', '🦕小恐龙');
        const payload = JSON.parse(Backup.base64ToUtf8(Backup.exportSaveCode()));
        expect(payload.data.childNickname).toBe('🦕小恐龙');
    });
});

describe('importSaveCode', () => {
    test('导入可恢复此前导出的全部数据', () => {
        localStorage.setItem('user_id', 'u-abc');
        localStorage.setItem('childNickname', '朵朵');
        localStorage.setItem('visitedMuseums', '["a","b"]');
        const code = Backup.exportSaveCode();

        localStorage.clear();
        const res = Backup.importSaveCode(code);
        expect(res.ok).toBe(true);
        expect(res.imported).toBe(3);
        expect(localStorage.getItem('user_id')).toBe('u-abc');
        expect(localStorage.getItem('childNickname')).toBe('朵朵');
        expect(localStorage.getItem('visitedMuseums')).toBe('["a","b"]');
    });

    test('即使存档码内含敏感 key 也会被跳过', () => {
        // 手工构造一个含 denylist key 的封包
        const payload = {
            v: 1,
            app: 'museumcheck',
            exportedAt: '2026-09-20T00:00:00.000Z',
            data: {
                user_id: 'u-x',
                deepseekApiKey: 'should-be-skipped',
                mc_debug: '1'
            }
        };
        const code = Backup.utf8ToBase64(JSON.stringify(payload));
        const res = Backup.importSaveCode(code);
        expect(res.ok).toBe(true);
        expect(res.imported).toBe(1);
        expect(res.skipped).toBe(2);
        expect(localStorage.getItem('user_id')).toBe('u-x');
        expect(localStorage.getItem('deepseekApiKey')).toBeNull();
        expect(localStorage.getItem('mc_debug')).toBeNull();
    });

    test('空码返回错误', () => {
        const res = Backup.importSaveCode('');
        expect(res.ok).toBe(false);
        expect(res.error).toBe('存档码为空');
    });

    test('乱码返回解析错误', () => {
        const res = Backup.importSaveCode('这不是有效的base64!!!');
        expect(res.ok).toBe(false);
        expect(typeof res.error).toBe('string');
    });

    test('合法 base64 但非 JSON 返回内容损坏', () => {
        const notJson = Backup.utf8ToBase64('just a plain string');
        const res = Backup.importSaveCode(notJson);
        expect(res.ok).toBe(false);
        expect(res.error).toBe('存档码内容损坏');
    });

    test('容错 URL-safe base64（- 与 _）', () => {
        localStorage.setItem('childNickname', 'user+name/test');
        const standard = Backup.exportSaveCode();
        // 把标准 base64 的 + / 换成 - _
        const urlSafe = standard.replace(/\+/g, '-').replace(/\//g, '_');
        localStorage.clear();
        const res = Backup.importSaveCode(urlSafe);
        expect(res.ok).toBe(true);
        expect(localStorage.getItem('childNickname')).toBe('user+name/test');
    });
});
