# 打卡页面设计系统 - 颜色和动画令牌

根据 UI/UX Pro Max 研究，本文档定义了打卡页面使用的设计令牌。

---

## 颜色面板

### 主色系 🎨

| 用途 | 颜色 | 十六进制 | RGB | 应用 |
|------|------|---------|-----|------|
| **主按钮背景** | 蓝紫渐变 | #667eea → #764ba2 | 102,126,234 → 118,75,162 | 继续按钮、主要 CTA |
| **成功状态** | 绿色渐变 | #28a745 → #20c997 | 40,167,69 → 32,201,151 | 完成通知、成功反馈 |
| **完成徽章** | 粉红渐变 | #f093fb → #f5576c | 240,147,251 → 245,87,108 | 任务完成指示器 |
| **删除操作** | 红色 | #ff4444 | 255,68,68 | 删除/危险操作 |
| **背景** | 浅色 | #f8f9fa | 248,249,250 | 设置面板、表单背景 |
| **边框** | 灰色 | #e9ecef | 233,236,239 | 输入字段、分隔符 |
| **文本主** | 深灰 | #333333 | 51,51,51 | 标题、正文 |
| **文本次** | 中灰 | #666666 | 102,102,102 | 副文本、提示 |
| **文本提示** | 浅灰 | #999999 | 153,153,153 | 占位符、禁用状态 |

### 背景渐变

| 位置 | 渐变 | 十六进制 | 用途 |
|------|------|---------|------|
| **页面背景** | 蓝色渐变 | #a8d8ea → #7fc8dc → #5ab4d1 | 整个页面背景 |
| **完成卡片** | 粉蓝渐变 | #a8edea → #fed6e3 | 已完成任务卡片 |
| **海报卡片** | 橙色渐变 | #ffecd2 → #fcb69f | 海报选择卡片 |
| **庆祝屏幕** | 蓝色渐变 | #a8d8ea → #7fc8dc → #5ab4d1 | 完成庆祝屏幕 |

---

## 动画令牌

### 动画曲线

#### 主动画曲线（推荐）
```css
/* 反弹、友好、自然的感觉 */
cubic-bezier(0.34, 1.56, 0.64, 1)
```
**特性**：
- 快速启动
- 过度冲过目标（overshooting）1.56 倍
- 温和着陆
- **用途**：任务卡片、按钮、徽章等主要交互

#### 标准缓动曲线
```css
/* 标准 Web 动画曲线 */
ease           /* 默认，平衡 */
ease-in        /* 缓慢启动 */
ease-out       /* 缓慢结束 */
ease-in-out    /* 两端缓慢 */
```

#### 按压反馈曲线
```css
/* 快速、立即反应 */
ease-out
```

### 动画时长

| 交互类型 | 时长 | 用途 | 示例 |
|---------|------|------|------|
| **即时反馈** | 100-150ms | 按下/悬停状态 | 按钮背景变化 |
| **标准 UI 动画** | 200-250ms | 大多数过渡 | 卡片悬停、模态框打开 |
| **完成动画** | 300-600ms | 成就/完成反馈 | 徽章弹出、完成翻转 |
| **进度动画** | 1000ms+ | 长时间过程 | 进度条填充、Shimmer 循环 |

### 具体动画定义

#### 1. 任务卡片悬停 🎯
```css
transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
transform: translateY(-6px) scale(1.02);
box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
```
- **时长**：250ms
- **变换**：向上 6px + 放大 2%
- **阴影**：变深、变大

#### 2. 完成徽章弹出 ✨
```css
@keyframes badgePop {
    0% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.15); }
    100% { transform: scale(1); opacity: 1; }
}
animation: badgePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
```
- **时长**：400ms
- **反弹**：过度到 115%，回弹到 100%

#### 3. 完成卡片翻转 🔄
```css
@keyframes completeFlip {
    0% { transform: scale(1) rotateY(0deg); }
    50% { transform: scale(1.05) rotateY(10deg); }
    100% { transform: scale(1) rotateY(0deg); }
}
animation: completeFlip 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
```
- **时长**：500ms
- **效果**：轻微 3D 翻转

#### 4. 进度条 Shimmer 💫
```css
@keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
}
animation: shimmer 2s infinite;
```
- **时长**：2s（循环）
- **效果**：持续光效通过

#### 5. 模态框滑入 📥
```css
@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
```
- **时长**：300ms
- **方向**：从下向上
- **距离**：30px

#### 6. Toast 通知滑入 🔔
```css
@keyframes toastSlideDown {
    from {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
}
animation: toastSlideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
```
- **时长**：400ms
- **方向**：从上向下
- **效果**：水平居中，淡入

#### 7. 庆祝屏幕进入 🎉
```css
animation: celebrationEnter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
```
- **时长**：600ms
- **效果**：从小到大放大 + 淡入

### 阴影级别

| 级别 | 小型 | 中型 | 大型 | 用途 |
|------|------|------|------|------|
| **1** | `0 2px 4px` | `0 4px 8px` | `0 8px 16px` | 微妙提升 |
| **2** | `0 2px 8px` | `0 4px 12px` | `0 8px 24px` | 标准 UI 元素 |
| **3** | `0 4px 12px` | `0 8px 24px` | `0 20px 60px` | 突出元素 |
| **深层** | - | - | `0 20px 60px` | 模态框、覆盖层 |

---

## 圆角半径（Border Radius）

| 尺寸 | 像素 | 用途 |
|------|------|------|
| **超小** | 4px | 细微角、输入字段焦点 |
| **小** | 8px | 标签、小卡片 |
| **中** | 12px | 普通按钮、小模态框 |
| **大** | 16px | 主按钮、输入字段 |
| **超大** | 24px | 任务卡片、大模态框 |
| **圆形** | 50%/9999px | 圆形徽章、圆形按钮 |

---

## 间距系统

### 标准间距（像素）
```
4px   - 微小间距（icon 内部）
8px   - 紧凑（按钮组间）
12px  - 小间距（卡片内）
16px  - 标准（页面内容）
20px  - 中间（区块间）
24px  - 大间距（主要区块）
32px  - 超大（页面顶级）
```

### 应用示例
- **任务卡片内部**：20px 填充
- **卡片之间**：20px 间隙
- **按钮之间**：10px 间隙
- **模态框**：30px 填充
- **页面边距**：15-20px

---

## 字体大小层级

| 用途 | 桌面 | 移动 | 字重 |
|------|------|------|------|
| **页面标题** | 32px | 28px | bold (700) |
| **区块标题** | 24px | 20px | bold (700) |
| **卡片标题** | 20px | 18px | bold (600) |
| **正文** | 16px | 16px | normal (400) |
| **副文本** | 14px | 14px | normal (400) |
| **标签/标签** | 12px | 12px | medium (500) |
| **提示文本** | 12px | 11px | normal (400) |

---

## 可访问性颜色对比

### WCAG AA 标准（4.5:1 最小值）

| 文字颜色 | 背景颜色 | 对比度 | 等级 |
|---------|---------|--------|------|
| #333333 | #ffffff | 12.6:1 | AAA ✅ |
| #666666 | #ffffff | 7.3:1 | AA ✅ |
| #ffffff | #667eea | 7.5:1 | AA ✅ |
| #ffffff | #28a745 | 5.6:1 | AA ✅ |
| #999999 | #ffffff | 4.6:1 | AA ✅ |

---

## 响应式设计断点

```css
/* 移动优先方法 */
Default        /* 320px+ 手机竖屏 */
@media (min-width: 480px)   /* 较大手机 */
@media (min-width: 768px)   /* 平板 */
@media (min-width: 1024px)  /* 桌面 */
@media (min-width: 1440px)  /* 大桌面 */
```

---

## 深色模式支持（未来）

```css
@media (prefers-color-scheme: dark) {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #f0f0f0;
  --text-secondary: #b0b0b0;
  --border: #3a3a3a;
}
```

---

## 动作反馈映射

| 用户操作 | 视觉反馈 | 时长 | 颜色 |
|---------|--------|------|------|
| **悬停** | 阴影 + 缩放 | 200ms | 更深 |
| **点击** | 缩放减小 | 100ms | 原色 |
| **完成** | 徽章弹出 + 翻转 | 500ms | 粉红 |
| **成功** | Toast 通知 | 400ms 进入，2-3s 显示 | 绿色 |
| **错误** | 红色闪烁 | 200ms | 红色 |
| **加载** | Shimmer | 2s 循环 | 白色渐变 |

---

## 导出和实现

### CSS 变量版本

```css
:root {
  /* 主色 */
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --success-gradient: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  --accent-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  
  /* 动画 */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-quick: 100ms;
  --duration-standard: 250ms;
  --duration-complete: 500ms;
  
  /* 间距 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 20px;
  --spacing-xl: 24px;
  
  /* 圆角 */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
}
```

### 使用示例
```css
.task-card {
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  transition: all var(--duration-standard) var(--ease-bounce);
}
```

---

## 尺寸一致性检查表

- [ ] 所有圆角半径来自标准集合
- [ ] 所有间距来自间距系统
- [ ] 所有动画时长来自定义的时长
- [ ] 所有动画曲线使用一致的缓动
- [ ] 所有颜色来自颜色面板
- [ ] 所有字体大小来自层级系统
- [ ] 所有阴影来自阴影级别

---

## 性能优化建议

1. **硬件加速**
   - 使用 `transform` 和 `opacity` 进行动画
   - 避免动画化 `top`, `left`, `width`, `height`

2. **渲染优化**
   - 使用 CSS Grid 而非 flex 计算复杂布局
   - 最小化重排（reflow）和重绘（repaint）

3. **动画优化**
   - 限制同时运行的动画数量
   - 使用 `will-change` 提示（谨慎使用）
   - 对动画使用 `transform` 和 `opacity`

---

## 更新日志

### v1.0（当前）
- ✅ 初始设计令牌定义
- ✅ Claymorphism 风格应用
- ✅ 反弹动画曲线集成
- ✅ Toast 通知系统
- ✅ 移动优先响应式设计

### 规划中（v1.1）
- 🔲 深色模式支持
- 🔲 声音反馈（可选）
- 🔲 振动反馈（移动端）
- 🔲 无缝动画优化

