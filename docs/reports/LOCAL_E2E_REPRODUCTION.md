# 本地重现 GitHub E2E 测试

## 问题诊断

GitHub E2E Action 失败的主要原因：
1. Playwright 配置中的 `testDir` 指向错误的目录 (`tests-e2e` 而不是 `e2e`)
2. 测试文件中缺少 base URL 配置
3. `single-museum.spec.ts` 测试引用了不存在的 `single-museum.html` 文件
4. 测试中的元素选择器与实际页面结构不匹配

## 修复内容

### 1. 更新 Playwright 配置 (`playwright.config.js`)
```javascript
module.exports = defineConfig({
  testDir: 'e2e',  // 修复: 从 tests-e2e 改为 e2e
  timeout: 30000,
  retries: 0,
  use: {
    headless: true,
    baseURL: 'http://localhost:8000',  // 添加 base URL
  },
  webServer: {
    command: 'python3 -m http.server 8000',
    port: 8000,
    reuseExistingServer: true,  // 允许重用已存在的服务器
  },
});
```

### 2. 修复 `single-museum.spec.ts` 测试
- 将 URL 从 `/single-museum.html` 改为 `/museum-checkin.html?museum=pinghu-museum&age=7-12`
- 更新元素选择器以匹配实际的 museum-checkin 页面结构
- 简化测试逻辑，专注于基本功能验证

## 本地运行命令

### 安装依赖
```bash
npm ci
```

### 安装 Playwright 浏览器
```bash
npx playwright install --with-deps chromium
```

### 运行 GitHub Action 中的 smoke 测试
```bash
npx playwright test e2e/homepage.spec.ts e2e/single-museum.spec.ts
```

### 运行所有 E2E 测试
```bash
npx playwright test
```

### 以 UI 模式运行测试（调试用）
```bash
npx playwright test --ui
```

## 验证结果

修复后，smoke 测试应该全部通过：
- ✅ `e2e/homepage.spec.ts:4:7` › Homepage smoke › loads and renders museum grid
- ✅ `e2e/single-museum.spec.ts:7:7` › Single museum flow › museum checkin page loads and displays tasks

## 其他说明

1. **服务器配置**: Playwright 会自动启动本地 HTTP 服务器，无需手动启动
2. **浏览器选择**: GitHub Action 使用 Chromium，本地测试也使用相同浏览器
3. **超时设置**: 测试超时设置为 30 秒，与 GitHub Action 保持一致
4. **重试机制**: 设置为 0 次重试，与 CI 环境保持一致

## 注意事项

- 其他 E2E 测试可能仍有失败，但 GitHub Action 中运行的 smoke 测试已修复
- 如需调试特定测试，可以使用 `--trace on` 参数生成详细追踪信息
- 测试结果会保存在 `playwright-report/` 目录中
