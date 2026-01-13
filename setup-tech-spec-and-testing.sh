#!/bin/bash

# ================================
# 技术规范维护流程与回归测试支持体系 - 自动化安装脚本
# ================================

set -e  # Exit on error

echo "🚀 开始安装技术规范维护和测试支持体系..."
echo ""

# =========================
# 步骤 1: 创建 CI/CD 工作流
# =========================

echo "📋 Step 1/6: 创建 CI/CD 工作流文件..."

# 创建 test.yml
cat > .github/workflows/test.yml << 'EOF'
name: Run Tests

on:
  push:
    branches: [ dev, main ]
  pull_request:
    branches: [ dev, main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test
      
      - name: Generate coverage report
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: false
      
      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          echo "Current coverage: $COVERAGE%"
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "❌ Coverage is below 80% threshold"
            exit 1
          else
            echo "✅ Coverage meets 80% threshold"
          fi
EOF

echo "  ✅ Created .github/workflows/test.yml"

# 创建 data-quality.yml
cat > .github/workflows/data-quality.yml << 'EOF'
name: Data Quality Checks

on:
  push:
    branches: [ dev, main ]
    paths:
      - 'museums/**'
      - 'script.js'
      - 'js/museums-data.js'
  pull_request:
    branches: [ dev, main ]
    paths:
      - 'museums/**'
      - 'script.js'
      - 'js/museums-data.js'

jobs:
  data-quality:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run data quality tests
        run: npm run test:data-quality
      
      - name: Validate museum data structure
        run: npm run validate-data
      
      - name: Check for duplicate museums
        run: |
          node -e "
          const fs = require('fs');
          let museums = [];
          
          // Try to load from museums-data.js first
          if (fs.existsSync('js/museums-data.js')) {
            const content = fs.readFileSync('js/museums-data.js', 'utf8');
            const match = content.match(/const MUSEUMS = (\[[\s\S]*?\]);/);
            if (match) {
              museums = eval(match[1]);
            }
          }
          
          // Fallback to script.js
          if (museums.length === 0 && fs.existsSync('script.js')) {
            const content = fs.readFileSync('script.js', 'utf8');
            const startIdx = content.indexOf('const MUSEUMS = [');
            if (startIdx !== -1) {
              const endIdx = content.indexOf('];', startIdx) + 2;
              museums = eval(content.substring(startIdx, endIdx).replace('const MUSEUMS = ', ''));
            }
          }
          
          console.log('✅ Total museums:', museums.length);
          
          const names = new Map();
          const ids = new Map();
          let dupNames = 0, dupIds = 0;
          
          museums.forEach((m, i) => {
            if (names.has(m.name)) {
              console.log(\`❌ DUPLICATE NAME: \${m.name} (indices \${names.get(m.name)} and \${i})\`);
              dupNames++;
            } else {
              names.set(m.name, i);
            }
            
            if (ids.has(m.id)) {
              console.log(\`❌ DUPLICATE ID: \${m.id} (indices \${ids.get(m.id)} and \${i})\`);
              dupIds++;
            } else {
              ids.set(m.id, i);
            }
          });
          
          if (dupNames === 0 && dupIds === 0) {
            console.log('✅ No duplicates found');
          } else {
            console.log(\`❌ Found \${dupNames} duplicate names and \${dupIds} duplicate IDs\`);
            process.exit(1);
          }
          "
      
      - name: Comment PR with results
        if: github.event_name == 'pull_request' && failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '❌ **Data Quality Check Failed**\n\nPlease review the museum data for duplicates or validation errors. See the workflow logs for details.'
            })
EOF

echo "  ✅ Created .github/workflows/data-quality.yml"

# 创建 e2e.yml
cat > .github/workflows/e2e.yml << 'EOF'
name: E2E Tests

on:
  pull_request:
    branches: [ dev, main ]
  schedule:
    # Run nightly at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  e2e-smoke:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    timeout-minutes: 15
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      
      - name: Run smoke tests
        run: npx playwright test e2e/homepage.spec.ts e2e/single-museum.spec.ts
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-smoke-report
          path: playwright-report/
          retention-days: 7

  e2e-full:
    if: github.event_name == 'schedule' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    timeout-minutes: 60
    
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}
      
      - name: Run E2E tests on ${{ matrix.browser }}
        run: npx playwright test --project=${{ matrix.browser }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/
          retention-days: 30
      
      - name: Upload test traces
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-traces-${{ matrix.browser }}
          path: test-results/
          retention-days: 30
EOF

echo "  ✅ Created .github/workflows/e2e.yml"
echo ""

# =========================
# 步骤 2: 创建技术规范模板
# =========================

echo "📋 Step 2/6: 创建技术规范模板..."

# Tech Spec Template 内容太长，需要分割或使用单独的文件
cat > docs/architecture/TECH_SPEC_TEMPLATE.md << 'TECHSPEC_EOF'
# Technical Specification Template

> **Version**: 1.0  
> **Status**: [Draft | Review | Approved | Implemented | Deprecated]  
> **Date**: YYYY-MM-DD  
> **Author**: [Your Name]  
> **Reviewers**: [List reviewers]

## Document Information

- **Related Feature**: [Link to feature request or issue]
- **Related ADRs**: [Links to relevant Architecture Decision Records]
- **Code Version**: [Git tag or commit when spec applies]
- **Last Updated**: YYYY-MM-DD

---

## 1. Overview

### 1.1 Purpose
Brief description of what this technical specification covers and why it exists.

### 1.2 Scope
- **In Scope**: What this spec covers
- **Out of Scope**: What this spec does NOT cover

### 1.3 Audience
Who should read this document (developers, QA, architects, etc.)

---

## 2. Requirements

### 2.1 Functional Requirements
- **FR-1**: [Requirement description]
- **FR-2**: [Requirement description]

### 2.2 Non-Functional Requirements
- **NFR-1 Performance**: [Performance requirements]
- **NFR-2 Security**: [Security requirements]

---

## 3. System Design

### 3.1 Architecture Overview
High-level description of the architecture.

### 3.2 Component Design
Description of major components.

---

## 4. Data Model

### 4.1 Data Structures
Define data structures and their relationships.

---

## 5. API Specification

### 5.1 Endpoints
Document API endpoints with request/response examples.

---

## 6. Security Considerations

### 6.1 Authentication & Authorization
How users are authenticated and what permissions are required.

---

## 7. Testing Strategy

### 7.1 Unit Tests
- **Coverage Target**: 80%+
- **Key Test Scenarios**: List critical scenarios

### 7.2 Regression Tests
- **Mandatory**: Must include regression tests for bug fixes

---

## 8. References

- [Related Document 1](#)
- [Related Document 2](#)

---

## 9. Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | YYYY-MM-DD | Name | Initial version |
TECHSPEC_EOF

echo "  ✅ Created docs/architecture/TECH_SPEC_TEMPLATE.md"
echo ""

# =========================
# 步骤 3: 创建 ADR 流程
# =========================

echo "📋 Step 3/6: 创建 ADR 流程文档..."

# 创建 adr 目录
mkdir -p docs/architecture/adr

# 创建 ADR README
cat > docs/architecture/adr/README.md << 'ADR_README_EOF'
# Architecture Decision Records (ADRs)

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision made along with its context and consequences.

## Why ADRs?

- **Knowledge Preservation**: Capture the "why" behind architectural decisions
- **Onboarding**: Help new team members understand past decisions
- **Consistency**: Ensure decisions are made thoughtfully and documented

## When to Create an ADR?

Create an ADR when making decisions about:

- ✅ **Architecture patterns**
- ✅ **Technology choices**
- ✅ **Data models**
- ✅ **API design**
- ✅ **Security approaches**

## ADR Naming Convention

```
NNNN-title-of-decision.md
```

Examples:
- `0001-use-jest-for-unit-testing.md`
- `0002-adopt-multi-tier-storage-architecture.md`

## Using the Template

1. Copy `adr-template.md`
2. Fill in all sections
3. Submit for review via PR
4. Update status as it progresses

## Best Practices

**DO:**
- ✅ Write ADRs in clear language
- ✅ Include diagrams when helpful
- ✅ Reference related documentation

**DON'T:**
- ❌ Skip ADRs for "obvious" decisions
- ❌ Write ADRs after the fact
- ❌ Edit accepted ADRs (create superseding ADRs instead)
ADR_README_EOF

echo "  ✅ Created docs/architecture/adr/README.md"

# 创建 ADR Template (简化版)
cat > docs/architecture/adr/adr-template.md << 'ADR_TEMPLATE_EOF'
# ADR-NNNN: [Short Title of Decision]

- **Status**: Draft | Review | Accepted | Implemented | Superseded | Deprecated
- **Date**: YYYY-MM-DD
- **Decision Makers**: [Names or roles]
- **Related Issues**: [Links to GitHub issues]

---

## Context

**What is the issue we're facing?**

Describe the context and problem statement.

---

## Decision

**What did we decide?**

State the architectural decision clearly.

**Why this approach?**

Explain the reasoning behind the decision.

---

## Alternatives Considered

### Option 1: [Alternative Name]

**Pros**:
- Advantage 1

**Cons**:
- Disadvantage 1

**Why not chosen**: Explanation

---

## Consequences

### Positive Consequences

- ✅ Benefit 1: Description

### Negative Consequences

- ⚠️ Trade-off 1: Description

---

## Implementation

### Changes Required

**Code Changes**:
- [ ] Task 1: Description

**Testing Changes**:
- [ ] Add unit tests

---

## References

- [Related ADR](#)
- [Technical resource](#)
ADR_TEMPLATE_EOF

echo "  ✅ Created docs/architecture/adr/adr-template.md"
echo ""

# =========================
# 步骤 4: 集中化 API 文档
# =========================

echo "📋 Step 4/6: 创建 API 文档索引..."

# API 文档索引 (简化版)
cat > docs/api/INDEX.md << 'API_INDEX_EOF'
# API Documentation Index

This directory contains comprehensive API documentation for the MuseumCheck application.

## Table of Contents

1. [DataManager API](#datamanager-api)
2. [Storage Adapters API](#storage-adapters-api)
3. [Letmetry Web Service API](#letmetry-web-service-api)
4. [EventBus API](#eventbus-api)

---

## DataManager API

**Full Documentation**: [DataManager API Reference](../architecture/API_REFERENCE.md)

The DataManager provides a unified interface for data persistence across multiple storage tiers.

### Quick Reference

```javascript
// Import
import DataManager from './core/data-manager.js';

// Basic operations
await dataManager.get('museum-id');
await dataManager.set('museum-id', data);
await dataManager.delete('museum-id');
```

---

## Storage Adapters API

Storage adapters provide pluggable storage backends.

### Available Adapters

- **LocalStorageAdapter**: Browser localStorage
- **KVStorageAdapter**: Key-value store (composite keys)
- **SQLStorageAdapter**: MySQL database
- **FileStorageAdapter**: Static JSON files

**⚠️ CRITICAL**: KV Store uses composite keys. Always include both `key` and `sortKey`.

---

## Letmetry Web Service API

**Live Swagger UI**: https://letmetry.cloud/api-docs/

### MySQL Operations

```bash
# Query
curl -X POST https://letmetry.cloud/mysql/query \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT * FROM museums WHERE id = ?", "params": [123]}'
```

---

## EventBus API

The EventBus provides pub-sub messaging for decoupled communication.

```javascript
import EventBus from './core/event-bus.js';

const eventBus = new EventBus();

// Subscribe
eventBus.on('museum:visited', (data) => {
    console.log('Museum visited:', data);
});

// Publish
eventBus.emit('museum:visited', { museumId: 'forbidden-city' });
```

---

## Related Documentation

- [Technical Specifications](../architecture/TECH_SPEC_TEMPLATE.md)
- [Architecture Overview](../ARCHITECTURE_OVERVIEW.md)
- [Testing Guide](../guides/testing.md)

---

**Last Updated**: January 13, 2026  
**Questions?**: Create an issue on [GitHub](https://github.com/jackandking/MuseumCheck/issues)
API_INDEX_EOF

echo "  ✅ Created docs/api/INDEX.md"
echo ""

# =========================
# 步骤 5: 创建 PR 模板
# =========================

echo "📋 Step 5/6: 创建 PR 模板..."

cat > .github/pull_request_template.md << 'PR_TEMPLATE_EOF'
## 变更说明
<!-- 简要描述此 PR 的主要变更 -->


## 变更类型
<!-- 请勾选适用的变更类型 -->

- [ ] 🐛 Bug 修复
- [ ] ✨ 新功能
- [ ] ⚡ 性能改进
- [ ] ♻️  代码重构
- [ ] 📝 文档更新
- [ ] 🏗️  架构变更

## 测试情况
<!-- 描述测试情况 -->

- [ ] 已运行所有单元测试 (`npm test`)
- [ ] 已添加新的测试用例（如适用）
- [ ] 已运行数据质量检查 (`npm run test:data-quality`，如修改博物馆数据)
- [ ] 已手动测试通过
- [ ] 已验证测试覆盖率达标 (`npm run test:coverage`)

## 技术规范与架构
<!-- 如果涉及架构或数据模型变更，请完成以下检查 -->

- [ ] **技术规范已更新**（如适用）
  - 位置: `docs/architecture/[spec-name].md`
  - 或创建新规范: [TECH_SPEC_TEMPLATE.md](../docs/architecture/TECH_SPEC_TEMPLATE.md)

- [ ] **架构决策记录 (ADR) 已创建**（如有重大架构决策）
  - 位置: `docs/architecture/adr/NNNN-decision-title.md`
  - 参考模板: [adr-template.md](../docs/architecture/adr/adr-template.md)

- [ ] **API 文档已更新**（如修改 API）
  - DataManager API: `docs/architecture/API_REFERENCE.md`
  - 或添加到: `docs/api/`

## 回归测试
<!-- Bug 修复必须包含回归测试 -->

- [ ] **已添加回归测试**（如修复 Bug）
  - 测试位置: `tests/regression.test.js` 或新的测试文件
  - 测试描述: <!-- 简述回归测试场景 -->

- [ ] **已验证修复有效**
  - 测试覆盖了 Bug 重现场景
  - 所有相关测试通过

## 数据质量
<!-- 如果修改了博物馆数据 -->

- [ ] **无重复博物馆**（已运行重复检查）
- [ ] **数据结构完整**（所有必需字段存在）
- [ ] **已验证数据一致性**

## 相关 Issue
<!-- 关联相关的 GitHub Issue -->

关闭 #<!-- issue number -->

## 检查清单
<!-- 提交前最终检查 -->

- [ ] 代码遵循项目编码规范
- [ ] 提交信息清晰明确（遵循 [Conventional Commits](https://www.conventionalcommits.org/)）
- [ ] 文档已更新（README, Wiki, 技术规范等）
- [ ] 向后兼容（或已记录破坏性变更）
- [ ] 无 console.log 或调试代码残留
- [ ] 已在本地环境完整测试

## 截图/演示
<!-- 如果是 UI 变更，请提供截图或 GIF 演示 -->


## 额外说明
<!-- 其他需要审查者知道的信息 -->

PR_TEMPLATE_EOF

echo "  ✅ Created .github/pull_request_template.md"
echo ""

# =========================
# 步骤 6: 更新文档引用
# =========================

echo "📋 Step 6/6: 更新文档快速参考..."

# 备份原文件
cp docs/DOCS_QUICK_REF.md docs/DOCS_QUICK_REF.md.backup

# 追加新内容到文档
cat >> docs/DOCS_QUICK_REF.md << 'DOCS_UPDATE_EOF'

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
DOCS_UPDATE_EOF

echo "  ✅ Updated docs/DOCS_QUICK_REF.md"
echo ""

# =========================
# 完成总结
# =========================

echo "✅ 安装完成！"
echo ""
echo "===================="
echo "📦 创建的文件清单:"
echo "===================="
echo ""
echo "CI/CD 工作流 (3 个):"
echo "  ✅ .github/workflows/test.yml"
echo "  ✅ .github/workflows/data-quality.yml"
echo "  ✅ .github/workflows/e2e.yml"
echo ""
echo "技术规范和 ADR (3 个):"
echo "  ✅ docs/architecture/TECH_SPEC_TEMPLATE.md"
echo "  ✅ docs/architecture/adr/README.md"
echo "  ✅ docs/architecture/adr/adr-template.md"
echo ""
echo "API 文档 (1 个):"
echo "  ✅ docs/api/INDEX.md"
echo ""
echo "PR 模板 (1 个):"
echo "  ✅ .github/pull_request_template.md"
echo ""
echo "文档更新 (1 个):"
echo "  ✅ docs/DOCS_QUICK_REF.md (已追加新内容)"
echo ""
echo "===================="
echo "🚀 下一步操作:"
echo "===================="
echo ""
echo "1. 配置 Codecov (可选):"
echo "   - 访问 https://codecov.io/"
echo "   - 连接 GitHub 仓库"
echo "   - 获取 CODECOV_TOKEN"
echo "   - 添加到 GitHub Secrets"
echo ""
echo "2. 测试 CI 工作流:"
echo "   git add -A"
echo "   git commit -m 'feat: Add tech spec maintenance and testing infrastructure'"
echo "   git push origin dev"
echo ""
echo "3. 创建第一个 ADR:"
echo "   cp docs/architecture/adr/adr-template.md docs/architecture/adr/0001-initial-testing-framework.md"
echo "   # 编辑文件记录初始测试框架决策"
echo ""
echo "4. 更新 README 添加测试覆盖率徽章 (配置 Codecov 后):"
echo "   [![codecov](https://codecov.io/gh/jackandking/MuseumCheck/branch/dev/graph/badge.svg)](https://codecov.io/gh/jackandking/MuseumCheck)"
echo ""
echo "===================="
echo "📚 参考文档:"
echo "===================="
echo "  - 技术规范模板: docs/architecture/TECH_SPEC_TEMPLATE.md"
echo "  - ADR 流程说明: docs/architecture/adr/README.md"
echo "  - API 文档索引: docs/api/INDEX.md"
echo "  - PR 模板: .github/pull_request_template.md"
echo "  - 文档快速参考: docs/DOCS_QUICK_REF.md"
echo ""
echo "✨ 技术规范维护流程和回归测试支持体系安装完成！"
