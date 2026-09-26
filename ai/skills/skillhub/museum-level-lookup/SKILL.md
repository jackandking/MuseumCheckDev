---
name: museum-level-lookup
displayName: 博物馆级别查询
description: 查询中国博物馆的官方质量等级（一级/二级/三级）及基本信息。支持国博、故宫、南博、陕历博等 30+ 常见简称别名。当用户询问某博物馆是几级馆、官方等级、博物馆级别时使用。
version: 1.0.0
---

# 博物馆级别查询

调用后端接口查询博物馆官方质量等级及基本信息。

## 接口信息
- 接口地址：`POST https://museumcheck.cn/skillhub/museum-level`
- 鉴权：SkillHub 标准鉴权（SKILL_TOKEN）

## 入参

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| museumName | string | 是 | 博物馆名称，支持别名 |

## 出参

| 字段 | 类型 | 说明 |
|---|---|---|
| name | string | 官方名称 |
| level | string | 质量等级（国家一级博物馆/国家二级博物馆/国家三级博物馆） |
| province | string | 所在省份 |
| city | string | 所在城市 |
| type | string | 性质（文物系统/行业等） |

## 别名支持
支持故宫、国博、南博、陕历博、上博、三星堆、兵马俑、苏博、湖博、河博、辽博等 30+ 常见简称。

## 未收录处理
返回未找到时，如实回复「该博物馆暂时还没收录哦，可以试试它的官方全称再查询」，禁止编造等级。

## 产品信息
- 主站：https://museumcheck.cn/
- 开源：https://github.com/jackandking/MuseumCheck
