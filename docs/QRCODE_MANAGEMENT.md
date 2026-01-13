# 二维码图片管理方案

**问题**: 二维码图片是否可以移动到 `archive/` 目录？  
**答案**: ❌ **不能直接移动** - 会破坏应用功能

---

## 📍 问题分析

### 当前二维码的使用情况

二维码被以下模块使用：

1. **museum-checkin.html** (主打卡页面)
   - 生成海报时需要加载二维码图片
   - 代码: `qrImg.src = museumQRFile`
   - 期望位置: **根目录** (e.g., `MuseumCheck_QRCode_ForbiddenCity.png`)

2. **E2E 测试** (pinghu-museum-checkin.spec.ts)
   - 验证二维码是否正确加载
   - 期望位置: **根目录**

3. **单元测试** (poster-qr-code.test.js, qr-code-urls.test.js)
   - 测试 QR 码文件名生成
   - 期望路径: `path.join(__dirname, '..', 'MuseumCheck_QRCode_*.png')`

### 如果移动会发生什么？

```javascript
// 当前代码 (根目录查找)
qrImg.src = 'MuseumCheck_QRCode_ForbiddenCity.png';  // ✅ 有效

// 移动后 (404 错误)
qrImg.src = 'MuseumCheck_QRCode_ForbiddenCity.png';  // ❌ 文件未找到
// 只能加载备用微信二维码 (降级体验)
```

---

## ✅ 正确的解决方案

### 方案 1: 保持在根目录 (推荐 - 零改动)

**现状**: 二维码保留在根目录  
**优点**:
- ✅ 应用无需任何修改
- ✅ 测试无需任何修改
- ✅ 用户体验不受影响
- ✅ 简单、稳定

**缺点**:
- ❌ 根目录仍有二维码文件

**何时选用**: 优先级不高，维持当前状态

### 方案 2: 移动 + 更新所有引用 (推荐 - 更清晰)

**步骤**:

1. **移动二维码到统一目录**
   ```bash
   mkdir -p qrcodes/
   mv MuseumCheck_QRCode_*.png MuseumCheck_QRCode_*.jpg qrcodes/
   ```

2. **更新 museum-checkin.html**
   ```javascript
   // 从:
   qrImg.src = `MuseumCheck_QRCode_${pascalCase}.png`;
   
   // 改为:
   qrImg.src = `qrcodes/MuseumCheck_QRCode_${pascalCase}.png`;
   
   // 备用:
   fallbackQR.src = 'qrcodes/MuseumCheck_QRCode_WX.jpg';
   ```

3. **更新 E2E 测试**
   ```typescript
   // 从:
   const response = await page.request.get(`${BASE_URL}/MuseumCheck_QRCode_PinghuMuseum.png`);
   
   // 改为:
   const response = await page.request.get(`${BASE_URL}/qrcodes/MuseumCheck_QRCode_PinghuMuseum.png`);
   ```

4. **更新单元测试**
   ```javascript
   // 从:
   const qrPath = path.join(__dirname, '..', 'MuseumCheck_QRCode_*.png');
   
   // 改为:
   const qrPath = path.join(__dirname, '..', 'qrcodes', 'MuseumCheck_QRCode_*.png');
   ```

**优点**:
- ✅ 根目录更清晰
- ✅ 资源分类明确
- ✅ 易于维护

**缺点**:
- ⚠️ 需要修改 3 个地方
- ⚠️ 需要运行测试验证

### 方案 3: 归档不用的二维码 (折中方案)

**分析二维码的用途**:
- 已上线博物馆: 需要保留 (故宫、国博、平湖等)
- 示例/测试用: 可以归档

**步骤**:

1. 保留常用二维码在根目录 (10 个)
   ```
   MuseumCheck_QRCode_ForbiddenCity.png       ✅ 需要
   MuseumCheck_QRCode_NationalMuseum.png      ✅ 需要
   MuseumCheck_QRCode_PinghuMuseum.png        ✅ 需要
   MuseumCheck_QRCode_WX.jpg                  ✅ 需要 (备用)
   ... (6 个常用)
   ```

2. 归档不常用的二维码
   ```
   archive/qrcodes/
   ├── MuseumCheck_QRCode_ZhaoyuanHengliWatchMuseum.png
   ├── MuseumCheck_QRCode_ChinaArtMuseum.png
   └── ... (5+ 个示例)
   ```

**优点**:
- ✅ 保持常用文件易访问
- ✅ 根目录相对清晰
- ✅ 应用无需修改

**缺点**:
- ⚠️ 需要判断哪些是常用的

---

## 🎯 建议方案

### **推荐: 方案 2 + 创建 qrcodes/ 目录**

原因:
1. 清晰的目录结构 (qrcodes/ 而不是 archive/qrcodes/)
2. 改动最少 (只需修改引用路径)
3. 便于管理 (生成新的二维码自动放在 qrcodes/ 中)
4. 让根目录更干净

### 实施步骤

如果你想要实施，我可以:

```bash
# 1. 创建 qrcodes 目录
mkdir -p qrcodes/

# 2. 移动所有二维码
mv MuseumCheck_QRCode_*.png MuseumCheck_QRCode_*.jpg qrcodes/

# 3. 更新代码引用 (需要修改)
# - museum-checkin.html (第 7381, 7398 行)
# - e2e/pinghu-museum-checkin.spec.ts (第 220 行)
# - tests/poster-qr-code.test.js (第 70, 75, 80 行)

# 4. 运行测试验证
npm test
```

---

## 📊 方案对比

| 方案 | 根目录清晰度 | 改动量 | 风险 | 推荐度 |
|-----|-----------|--------|------|--------|
| 保持原样 | ❌ 低 | ✅ 0 | ✅ 无 | ⭐ 中 |
| 方案 2 (qrcodes/) | ✅ 高 | ⚠️ 3处 | ⭐ 低 | ⭐⭐⭐ 推荐 |
| 方案 3 (部分归档) | ⭐ 中 | ⚠️ 1处 | ⭐ 低 | ⭐⭐ |

---

## 🔄 如何回滚

如果出现问题，可以轻松回滚:

```bash
# 恢复所有二维码到根目录
mv qrcodes/*.png qrcodes/*.jpg .

# Git 回滚
git checkout HEAD -- museum-checkin.html e2e/ tests/
```

---

## 💡 我的建议

**现在**: 保持不动（当前状态最安全）  
**未来**: 当需要系统整理时，一起更新为 `qrcodes/` 目录

这样可以:
- 不打乱当前的代码审查
- 为未来的清理留好方案
- 避免不必要的修改

**你想怎么做？**

选项:
1. ✅ 保持现在的状态 (二维码在根目录，简单稳定)
2. 🔄 现在就更新到 qrcodes/ 目录 (需要我修改代码)
3. 📋 后续再考虑 (保留方案，以后实施)
