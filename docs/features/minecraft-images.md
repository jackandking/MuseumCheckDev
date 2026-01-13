# Minecraft Image Resources (我的世界图片素材)

## 概述 (Overview)

本文件收集了来自网络的Minecraft（我的世界）图片资源URL，主要来源于Minecraft Wiki。这些资源已按类别整理，方便在项目中使用。

This file contains a collection of Minecraft image URLs gathered from the internet, primarily from Minecraft Wiki. Resources are organized by category for easy use in projects.

## 文件说明 (File Description)

- **文件名 (Filename)**: `minecraft-images.json`
- **格式 (Format)**: JSON
- **编码 (Encoding)**: UTF-8
- **版本 (Version)**: 1.0
- **最后更新 (Last Updated)**: 2025-11-03

## 内容分类 (Categories)

本资源文件包含以下分类：

### 1. 方块 (Blocks)
- 18种常见Minecraft方块
- 包括：草方块、石头、泥土、木板、矿石等
- Sprite格式，16x16像素

### 2. 物品 (Items)
- 25种常用物品和工具
- 包括：钻石剑、镐子、盔甲、食物、材料等
- Sprite格式，16x16像素

### 3. 生物 (Mobs)
- 19种敌对、中立和被动生物
- 包括：苦力怕、僵尸、村民、牛、猪等
- Sprite格式，16x16像素

### 4. 生物群系 (Biomes)
- 10种主要生物群系
- 包括：平原、森林、沙漠、下界、末地等
- 提供Wiki参考链接

### 5. 角色 (Characters)
- 玩家角色：史蒂夫、艾利克斯
- 提供Wiki参考链接

### 6. 图标 (Icons)
- 游戏UI图标：生命值、饥饿值、经验值

## 数据结构 (Data Structure)

```json
{
  "metadata": {
    "title": "资源标题",
    "description": "资源描述",
    "source": "来源",
    "license": "许可证信息",
    "version": "版本号"
  },
  "categories": {
    "blocks": {
      "description": "分类描述",
      "images": [
        {
          "name": "英文名称",
          "chineseName": "中文名称",
          "url": "图片URL",
          "type": "类型",
          "size": "尺寸",
          "tags": ["标签1", "标签2"]
        }
      ]
    }
  }
}
```

## 使用示例 (Usage Examples)

### JavaScript/Node.js

```javascript
// 读取JSON文件
const minecraftImages = require('./minecraft-images.json');

// 获取所有方块图片
const blocks = minecraftImages.categories.blocks.images;
console.log(`共有 ${blocks.length} 个方块`);

// 查找特定物品
const diamondSword = minecraftImages.categories.items.images
  .find(item => item.name === "Diamond Sword");
console.log(`钻石剑URL: ${diamondSword.url}`);

// 按标签筛选
const hostileMobs = minecraftImages.categories.mobs.images
  .filter(mob => mob.tags.includes("敌对"));
console.log(`敌对生物数量: ${hostileMobs.length}`);
```

### Python

```python
import json

# 读取JSON文件
with open('minecraft-images.json', 'r', encoding='utf-8') as f:
    minecraft_images = json.load(f)

# 获取所有生物
mobs = minecraft_images['categories']['mobs']['images']
print(f"共有 {len(mobs)} 种生物")

# 查找特定方块
grass_block = next(
    (block for block in minecraft_images['categories']['blocks']['images']
     if block['name'] == "Grass Block"),
    None
)
if grass_block:
    print(f"草方块URL: {grass_block['url']}")

# 按标签筛选
rare_items = [
    item for item in minecraft_images['categories']['items']['images']
    if '稀有' in item['tags']
]
print(f"稀有物品数量: {len(rare_items)}")
```

### HTML/Web

```html
<!DOCTYPE html>
<html>
<head>
    <title>Minecraft Resources</title>
</head>
<body>
    <h1>Minecraft 方块展示</h1>
    <div id="blocks-container"></div>

    <script>
        fetch('minecraft-images.json')
            .then(response => response.json())
            .then(data => {
                const container = document.getElementById('blocks-container');
                data.categories.blocks.images.forEach(block => {
                    const div = document.createElement('div');
                    div.innerHTML = `
                        <img src="${block.url}" alt="${block.name}">
                        <p>${block.chineseName}</p>
                    `;
                    container.appendChild(div);
                });
            });
    </script>
</body>
</html>
```

## 许可证与归属 (License & Attribution)

### 重要提示 (Important Notes)

1. **来源 (Source)**: 所有图片URL来自Minecraft Wiki（https://minecraft.wiki）
2. **版权 (Copyright)**: 大多数sprite图片使用Creative Commons许可证或公平使用原则
3. **归属 (Attribution)**: 使用这些图片时，请注明来源为Minecraft Wiki和Mojang Studios
4. **商业使用 (Commercial Use)**: 商业使用需联系Mojang Studios获取适当授权
5. **教育使用 (Educational Use)**: 教育和个人使用通常在公平使用原则下被允许

### 推荐归属格式 (Recommended Attribution)

```
图片来源: Minecraft Wiki (https://minecraft.wiki)
Minecraft © Mojang Studios
```

## 额外资源 (Additional Resources)

### Minecraft Wiki 分类页面

- **物品Sprites**: https://minecraft.wiki/w/Category:ItemSprite_images
- **方块Sprites**: https://minecraft.wiki/w/Category:BlockSprite_images
- **生物Sprites**: https://minecraft.wiki/w/Category:MobSprite_images
- **公共领域图片**: https://minecraft.fandom.com/wiki/Category:Public_domain_images

### 其他资源

- **MC Asset Browser**: https://mcasset.cloud/latest (浏览Minecraft游戏资源)
- **Pixabay**: https://pixabay.com/images/search/minecraft/ (用户生成内容)

## URL格式说明 (URL Format)

Sprite图片URL遵循以下格式：

```
https://static.minecraft.wiki/images/{Type}Sprite_{name}.png
```

其中：
- `{Type}` 可以是: `Block`、`Item`、`Mob`
- `{name}` 是物品的英文名称（使用下划线分隔）

示例：
- 方块: `https://static.minecraft.wiki/images/BlockSprite_grass_block.png`
- 物品: `https://static.minecraft.wiki/images/ItemSprite_diamond_sword.png`
- 生物: `https://static.minecraft.wiki/images/MobSprite_creeper.png`

**注意**: 所有URL使用 `static.minecraft.wiki` (静态CDN) 而不是 `minecraft.wiki`，这是Minecraft Wiki的官方静态资源CDN地址。

## 数据统计 (Statistics)

- **方块 (Blocks)**: 18种
- **物品 (Items)**: 25种
- **生物 (Mobs)**: 19种
- **生物群系 (Biomes)**: 10种
- **角色 (Characters)**: 2种
- **图标 (Icons)**: 3种
- **总计 (Total)**: 77种资源

## URL验证 (URL Validation)

本仓库包含一个验证脚本 `validate-minecraft-images.js`，可用于检查所有图片URL的可访问性：

```bash
# 运行验证脚本
node validate-minecraft-images.js
```

**注意**: URL验证需要网络访问权限。如果您的环境有防火墙或代理设置，可能需要相应配置。某些企业网络环境可能会阻止对Minecraft Wiki的访问。

## 更新日志 (Changelog)

### v1.0 (2025-11-03)
- 初始版本发布
- 收集了77种Minecraft资源URL
- 按6个主要类别组织
- 添加中英文双语标签
- 包含使用说明和代码示例

## 贡献 (Contributing)

如需添加更多资源或更新现有资源，请：

1. 确保URL有效且图片可访问
2. 验证图片来源和许可证
3. 按照现有格式添加数据
4. 更新本README中的统计信息
5. 提交Pull Request

## 联系方式 (Contact)

如有问题或建议，请通过项目的Issue页面反馈。

---

**注意**: 本资源文件仅供学习和参考使用。在任何商业项目中使用前，请确保遵守相关版权和许可证要求。

**Note**: This resource file is for learning and reference purposes only. Before using in any commercial project, please ensure compliance with relevant copyright and licensing requirements.
