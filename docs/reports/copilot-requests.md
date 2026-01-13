# COPILOT_REQUESTS.md

本文件用于集中记录所有由用户、产品或维护者提出的需求、功能请求与变更说明。

模板（追加新条目时请复制此模板）：

---
日期: YYYY-MM-DD
提出者: 
标题: 
概要: 
详细描述: 
验收标准: 
优先级: P0/P1/P2
相关文件: 
关联 Issue/PR: 
状态: Draft / Confirmed / In Progress / Done
后续任务（如适用，列出 TODO-1, TODO-2 等）:
- TODO-1: 
- TODO-2: 
---

示例：

---
日期: 2025-12-31
提出者: 产品经理（张三）
标题: 将所有用户需求汇总到单一文件
概要: 统一记录后续需求以保证设计连续性
详细描述: 在 .github/copilot-instructions.md 中增加指引，要求 Copilot 将后续需求追加到 COPILOT_REQUESTS.md。要求条目包含接受标准和优先级。
验收标准:
  - COPILOT_REQUESTS.md 存在于仓库根目录
  - 新条目按照模板追加且包含日期、提出者、标题、优先级、验收标准
优先级: P1
相关文件: .github/copilot-instructions.md
关联 Issue/PR: #123
状态: Done
后续任务:
- TODO-1: 更新 .github/copilot-instructions.md，加入必要说明并在回复中引用条目路径
---
