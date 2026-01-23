# GitHub Actions 通知配置指南

## 问题说明

GitHub Actions workflow 失败时，默认只有触发 workflow 的人会收到通知。当 workflow 由 push 事件自动触发时，可能没有人会收到失败通知。

## 解决方案

### 1. 个人通知设置（必须）

在 GitHub 网页端：
1. 进入 **Settings** → **Notifications**
2. 确保 **"Workflow runs"** 已勾选 ✅
3. 检查邮箱设置是否正确
4. 选择通知方式（Email/Digest）

### 2. 仓库通知设置（推荐）

在仓库页面：
1. 点击右上角的 **Watch** 按钮
2. 选择 **Watching**（而不是 Custom 或 Ignored）
3. **Watching** 会收到所有通知，包括 workflow 失败

### 3. Workflow 自动通知（已配置）

已在重要的 workflow 中添加了失败通知功能：

#### 📝 文档位置检查 Workflow
- 失败时自动创建 Issue 通知
- 包含详细的错误信息和相关链接
- 标签：`bug`, `workflow-failure`, `docs`

#### 🧪 E2E 测试 Workflow  
- 失败时自动创建 Issue 通知
- 包含浏览器信息和测试报告链接
- 标签：`bug`, `workflow-failure`, `test`

### 4. 邮件/Slack 通知（可选）

如需更及时的通知，可以添加：

```yaml
- name: 📧 发送邮件通知
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 587
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: "🚨 GitHub Action 失败: ${{ github.workflow }}"
    body: |
      Workflow ${{ github.workflow }} 在 ${{ github.repository }} 失败了。
      
      分支: ${{ github.ref }}
      提交: ${{ github.sha }}
      
      查看详情: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
    to: your-email@example.com
```

## 通知层级

| 通知方式 | 优点 | 缺点 | 配置难度 |
|---------|------|------|----------|
| GitHub 默认通知 | 简单 | 只有触发者收到 | 低 |
| 仓库 Watching | 全面 | 可能通知过多 | 低 |
| Issue 自动创建 | 永久记录 | 需要处理 Issue | 中 |
| 邮件通知 | 及时 | 需要 SMTP 配置 | 高 |
| Slack/Teams | 团队可见 | 需要集成配置 | 高 |

## 最佳实践

1. **个人设置**：确保 GitHub 通知设置正确
2. **仓库 Watching**：对重要仓库设置为 Watching
3. **Workflow 通知**：在关键 workflow 中配置失败通知
4. **定期检查**：定期查看 Actions 页面，即使没有收到通知
5. **标签管理**：使用一致的标签管理 workflow 失败 issue

## 故障排除

### 没有收到任何通知

1. 检查 GitHub 通知设置
2. 确认仓库设置为 Watching
3. 检查邮箱垃圾邮件文件夹
4. 验证 workflow 是否真的失败（查看 Actions 页面）

### 只收到部分通知

1. 确认哪些 workflow 配置了通知
2. 检查 workflow 的触发条件
3. 验证 `if: failure()` 条件是否正确

### 通知过于频繁

1. 将仓库设置改为 Custom
2. 选择性订阅特定事件
3. 使用邮件过滤规则

## 当前状态

✅ **已配置的 workflow 通知**：
- `check-docs-location.yml` - 文档位置检查失败通知
- `e2e.yml` - E2E 测试失败通知

✅ **建议的个人设置**：
- GitHub 通知中启用 "Workflow runs"
- 重要仓库设置为 "Watching"

这样配置后，当 workflow 失败时，你会通过多种渠道收到通知，确保不会错过重要的失败信息。
