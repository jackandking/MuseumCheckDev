---
name: museumcheck-mcp
displayName: 博物馆打卡助手
description: 精选中国博物馆名录，提供博物馆官方等级查询、镇馆之宝图文介绍、个性化打卡攻略生成等能力。适用于博物馆参观规划、文博知识科普、亲子逛馆打卡等场景。让每一次博物馆之旅都更有收获。
version: 1.0.0
---

# 博物馆打卡助手（扣子 MCP Plugin 版）

基于 MCP 协议的博物馆文博能力服务，以 Coze Plugin 形式发布。

## 服务信息
- MCP endpoint：`https://museumcheck.cn/mcp`
- 协议：MCP (Model Context Protocol)
- 发布位置：扣子空间 7530271143622967337
- 类型：MCP 插件

## 工具列表

### 1. museum_level
查询博物馆官方质量等级及基本信息。
- 入参：museumName（博物馆名称，支持别名）
- 出参：官方名称、质量等级、所在省市、性质

### 2. museum_treasures
获取博物馆必看藏品的图文介绍。
- 入参：museumName（博物馆名称，支持别名）
- 出参：藏品数组（名称、朝代、类别、实拍图、简介）
- 备注：免费版，图片+简介

### 3. museum_checkin
基于用户兴趣生成 5 任务参观打卡清单。
- 入参：museumName + interest（可选兴趣标签）
- 出参：5 个可执行任务，含任务说明和打卡提示
- 亲子自动适配：检测到亲子关键词时自动调整

## 别名支持
支持故宫、国博、南博、陕历博、上博、三星堆、兵马俑、苏博、湖博、河博、辽博等 30+ 常见简称。

## 产品信息
- 主站：https://museumcheck.cn/
- 开源：https://github.com/jackandking/MuseumCheck
