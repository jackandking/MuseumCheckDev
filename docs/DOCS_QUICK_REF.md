# 📝 文档创建快速参考

## 🚫 禁止行为

**绝对不要在根目录创建大写命名的 .md 文件！**

---

## ✅ 正确做法

### 文档类型 → 目标目录

| 文档类型 | 目录 | 示例 |
|---------|------|------|
| 🏗️ 架构设计 | `docs/architecture/` | `kv-store-design.md` |
| 🎯 功能说明 | `docs/features/` | `museum-checkin.md` |
| 📚 开发指南 | `docs/guides/` | `quick-start.md` |
| 🔌 API 文档 | `docs/api/` | `letmetry-api.md` |
| 📊 进度报告 | `docs/reports/` | `phase-1-completion.md` |

---

## 🤖 Copilot 工作流

```
需要创建文档？
    │
    ├─ 确定类型（架构/功能/指南/API/报告）
    ├─ 选择 docs/ 子目录
    ├─ 使用小写连字符命名 (feature-name.md)
    └─ 创建文件
```

---

## 📋 命名规范

**✅ GOOD**: `quick-start-guide.md`  
**❌ BAD**: `QUICK_START_GUIDE.md`

---

## 🔍 自动检查

```bash
# 本地检查
bash scripts/check-docs-location.sh

# CI/CD 自动检查（PR 时）
# 见 .github/workflows/check-docs-location.yml
```

---

## 📖 详细文档

完整规范请查看: [.github/copilot-instructions-docs.md](../.github/copilot-instructions-docs.md)

---

## 🆕 技术规范与 ADR

### 技术规范模板

**位置**: `docs/architecture/TECH_SPEC_TEMPLATE.md`

**何时使用**:
- 设计新功能或模块时
- 重大代码重构时
- 需要团队协作的技术实现

**如何使用**:
```bash
cp docs/architecture/TECH_SPEC_TEMPLATE.md docs/architecture/your-feature-spec.md
# 填写所有章节，提交 PR 审查
```

### 架构决策记录 (ADR)

**位置**: `docs/architecture/adr/`

**何时使用**:
- 选择技术栈或框架时
- 重大架构设计决策时
- 数据模型变更时

**如何使用**:
```bash
# 1. 确定 ADR 编号
ls docs/architecture/adr/*.md | wc -l

# 2. 复制模板
cp docs/architecture/adr/adr-template.md docs/architecture/adr/0001-your-decision.md

# 3. 填写内容，提交 PR
```

**流程**: Draft → Review → Accepted → Implemented

---

## 🧪 测试和质量保证

### CI/CD 工作流

项目现已集成以下自动化检查:

1. **单元测试** (`.github/workflows/test.yml`)
   - 自动运行: PR 和 push 到 dev/main
   - 测试覆盖率检查: 80% 阈值
   - 支持 Node.js 18.x 和 20.x

2. **数据质量检查** (`.github/workflows/data-quality.yml`)
   - 触发条件: 修改 `museums/**`, `script.js`, `js/museums-data.js`
   - 检查重复博物馆
   - 验证数据结构完整性

3. **E2E 测试** (`.github/workflows/e2e.yml`)
   - PR 时运行冒烟测试
   - 每日凌晨 2AM UTC 运行完整测试套件
   - 支持 Chromium, Firefox, WebKit

### PR 模板

**位置**: `.github/pull_request_template.md`

**新增检查项**:
- [ ] 技术规范已更新（如适用）
- [ ] 架构决策记录已创建（如有重大架构决策）
- [ ] API 文档已更新（如修改 API）
- [ ] 已添加回归测试（如修复 Bug）

---

## 📊 API 文档集中化

**新的 API 文档索引**: `docs/api/INDEX.md`

**包含**:
- DataManager API 快速参考
- Storage Adapters API
- Letmetry Web Service API
- EventBus API

**链接到完整文档**:
- DataManager: `docs/architecture/API_REFERENCE.md`
- Data Flow: `docs/architecture/DATA_FLOW.md`

---

**最后更新**: 2026-01-13  
**维护者**: MuseumCheck 开发团队
