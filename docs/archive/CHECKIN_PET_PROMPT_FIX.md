# 打卡页面宠物提示优化 - 技术文档

## 问题描述

### 原始问题
新用户第一次打开打卡页面时，昵称设定提示和宠物领养提示同时出现，造成用户体验混乱。

**时间线冲突：**
- T+800ms: 昵称编辑提示出现（针对新用户）
- T+1000ms: 宠物领养提示出现
- 结果：两个提示几乎同时显示，用户不知道先处理哪个

### 第二个问题
使用默认昵称的用户在生成海报时被标记为"匿名"，因为默认昵称没有被写入localStorage。

## 解决方案

### 1. 宠物提示延迟触发机制

**核心思路：** 只在用户积累足够积分后才显示宠物领养提示

**实现细节：**
```javascript
// virtual-pet.js: showPetAdoptionPrompt()
showPetAdoptionPrompt(reason = 'general') {
    // 只在用户没有宠物时显示
    if (this.hasPet()) return;
    
    // 新增：最低积分要求
    const currentPoints = this.getCurrentPoints();
    const MINIMUM_POINTS_FOR_PROMPT = 10;
    
    if (currentPoints < MINIMUM_POINTS_FOR_PROMPT) {
        return; // 积分不足，不显示提示
    }
    
    // ... 其他冷却时间检查逻辑 ...
}
```

**触发条件：**
- ✅ 用户积分 >= 10 分
- ✅ 用户尚未领养宠物
- ✅ 距离上次提示超过5分钟（冷却时间）

**效果：**
- 新用户（0分）：只看到昵称编辑提示
- 完成2个任务后（10分）：才会看到宠物提示
- 避免了同时显示两个提示的混乱

### 2. 默认昵称自动保存

**问题根源：** `loadChildNickname()` 生成默认昵称后只返回值，不保存

**修复代码：**
```javascript
// museum-checkin.html: loadChildNickname()
function loadChildNickname() {
    try {
        const saved = localStorage.getItem('childNickname');
        if (saved) {
            return saved;
        }
        
        // 生成默认昵称并立即保存
        const newNickname = generateRandomNickname();
        localStorage.setItem('childNickname', newNickname); // 新增
        return newNickname;
    } catch (error) {
        console.error('Failed to load child nickname:', error);
        return generateRandomNickname();
    }
}
```

**效果：**
- 默认昵称（如"用户a1b2c3d4"）被保存到localStorage
- 海报生成时能正确显示用户昵称，不会标记为"匿名"

## 测试覆盖

### 测试文件
`tests/checkin-pet-prompt-timing.test.js` - 13个测试用例

### 测试场景

#### 1. 积分要求测试 (5个测试)
- ✅ 0分用户 → 不显示宠物提示
- ✅ 5分用户 → 不显示宠物提示
- ✅ 10分用户 → 显示宠物提示
- ✅ 20分用户 → 显示宠物提示
- ✅ 已有宠物 → 不显示宠物提示

#### 2. 昵称存储测试 (2个测试)
- ✅ 首次加载自动保存默认昵称
- ✅ 不覆盖用户自定义昵称

#### 3. 冷却时间测试 (2个测试)
- ✅ 5分钟内不重复显示
- ✅ 5分钟后允许再次显示

#### 4. 集成场景测试 (2个测试)
- ✅ 新用户只看到昵称编辑
- ✅ 有积分用户看到宠物提示

#### 5. 边界情况测试 (2个测试)
- ✅ localStorage错误处理
- ✅ UUID生成格式验证

## 用户体验改进

### 改进前
```
新用户打开页面
└─ T+800ms: 昵称编辑框弹出 ⚠️
   T+1000ms: 宠物领养提示弹出 ⚠️
   └─ 混乱！两个提示同时存在
```

### 改进后
```
新用户打开页面
└─ T+800ms: 昵称编辑框弹出 ✅
   T+1000ms: 检查积分(0) → 不显示宠物提示 ✅
   └─ 清晰！只有一个提示

完成2个任务后 (10分)
└─ 下次打开页面或获得积分时
   └─ 宠物领养提示出现 ✅
```

## 技术细节

### 积分来源
- 完成打卡任务：5分/任务
- 上传照片：10分/张
- 完成游戏：10-30分（根据游戏类型和表现）

### 最低积分门槛选择
**为什么是10分？**
- 完成2个任务即可达到
- 对应用户已经熟悉应用基本操作
- 既不会太早（造成混乱），也不会太晚（错过引导时机）

### 冷却机制
- 使用 sessionStorage 记录上次提示时间
- 5分钟冷却，避免频繁打扰
- 关闭浏览器后重置（符合会话级别的设计）

## 兼容性说明

### 向后兼容
- ✅ 已有宠物的用户不受影响
- ✅ 已设置昵称的用户不受影响  
- ✅ 已有积分的用户正常显示提示

### 数据迁移
无需数据迁移，所有改动都是渐进式的：
- localStorage结构未变
- 只是在现有逻辑上增加条件判断

## 文件变更清单

### 修改文件
1. `virtual-pet.js` (19行修改)
   - 在 `showPetAdoptionPrompt()` 添加积分检查

2. `museum-checkin.html` (3行修改)
   - 在 `loadChildNickname()` 添加保存逻辑

### 新增文件
3. `tests/checkin-pet-prompt-timing.test.js` (337行)
   - 完整的测试套件

## 验证步骤

### 手动测试场景

#### 场景1：新用户首次访问
1. 清空浏览器localStorage
2. 访问打卡页面
3. **预期：** 只看到昵称编辑提示，无宠物提示

#### 场景2：完成任务后
1. 完成2个打卡任务（获得10分）
2. 刷新页面或触发积分变化
3. **预期：** 出现宠物领养提示

#### 场景3：默认昵称保存
1. 清空localStorage
2. 访问打卡页面
3. 打开DevTools > Application > Local Storage
4. **预期：** `childNickname` 键存在且有值

#### 场景4：海报生成
1. 使用默认昵称
2. 完成所有任务
3. 生成海报
4. **预期：** 海报显示"用户xxxxxxxx"，不显示"匿名"

### 自动化测试
```bash
npm test -- tests/checkin-pet-prompt-timing.test.js
```

**预期输出：**
```
PASS tests/checkin-pet-prompt-timing.test.js
  ✓ 13 tests passed
```

## 性能影响

### 新增操作
- 积分读取：~1ms（localStorage读取）
- 冷却检查：~0.1ms（sessionStorage读取）
- 昵称保存：~1ms（localStorage写入）

**总体影响：** 可忽略不计（<5ms）

## 后续优化建议

### 1. 积分阈值可配置化
```javascript
// 可以考虑从配置文件读取
const PET_PROMPT_MIN_XP = config.get('PET_PROMPT_MIN_XP', 10);
```

### 2. 更智能的提示时机
- 完成特定里程碑时提示（如第一次拍照）
- 在特定页面提示（如成就页面）

### 3. A/B测试不同阈值
- 测试5分、10分、15分三个阈值
- 观察用户领养率和体验反馈

## 总结

本次修复通过两个关键改动解决了用户体验问题：

1. **延迟宠物提示** - 基于用户积分判断，避免新手混乱
2. **自动保存昵称** - 确保默认昵称可用于海报生成

改动简洁、测试充分、向后兼容，预期能显著改善新用户的首次体验。
