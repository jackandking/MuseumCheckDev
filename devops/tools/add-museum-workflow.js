#!/usr/bin/env node

/**
 * 添加博物馆工作流工具
 *
 * 集成化工具，将添加新博物馆的多个步骤串成一条流水线：
 * 1. 收集博物馆基本信息
 * 2. 搜索建筑照片（Wikimedia优先）
 * 3. 生成数据模板文件
 * 4. 更新 museums-meta.json
 * 5. 重新生成 js/museums-meta.js
 * 6. 上传到 KV Store
 *
 * 用法：
 *   node tools/add-museum-workflow.js
 *   node tools/add-museum-workflow.js --id <id> --name <名称> --location <城市>
 *
 * 改进点（基于添加岳阳博物馆的经验）：
 * - 自动生成模板文件，减少手动创建
 * - 自动搜索建筑照片，减少手动搜索时间
 * - 自动更新 meta 和重新生成 JS
 * - 一键上传到 KV Store
 * - 自动验证数据完整性
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  templatesDir: path.join(__dirname, 'museum-data-templates'),
  metaPath: path.join(__dirname, '..', 'data', 'museums-meta.json'),
  kvEndpoint: 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore',
  expireAt: 4866674732
};

// ============================================================================
// 工具函数
// ============================================================================

function log(msg) {
  console.log(msg);
}

function success(msg) {
  console.log(`✅ ${msg}`);
}

function warn(msg) {
  console.log(`⚠️  ${msg}`);
}

function error(msg) {
  console.error(`❌ ${msg}`);
}

/**
 * 从命令行参数解析输入
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--id' && args[i + 1]) result.id = args[i + 1];
    if (args[i] === '--name' && args[i + 1]) result.name = args[i + 1];
    if (args[i] === '--location' && args[i + 1]) result.location = args[i + 1];
    if (args[i] === '--level' && args[i + 1]) result.level = args[i + 1];
    if (args[i] === '--image' && args[i + 1]) result.image = args[i + 1];
    if (args[i] === '--description' && args[i + 1]) result.description = args[i + 1];
    if (args[i] === '--tags' && args[i + 1]) result.tags = args[i + 1].split(',').map(t => t.trim());
  }

  return result;
}

/**
 * 交互式提问（简单版，使用命令行参数或默认值）
 */
async function prompt(question, defaultValue = '') {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    const promptText = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
    rl.question(promptText, answer => {
      rl.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}

/**
 * 搜索 Wikimedia Commons 图片
 */
async function searchWikimediaImages(query, limit = 5) {
  const https = require('https');

  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'search',
      gsrnamespace: '6',
      gsrsearch: query,
      gsrlimit: limit.toString(),
      prop: 'imageinfo|info',
      iiprop: 'url|size|mime',
      iiurlwidth: '800',
      inprop: 'url'
    });

    const options = {
      hostname: 'commons.wikimedia.org',
      path: `/w/api.php?${params.toString()}`,
      method: 'GET',
      headers: { 'User-Agent': 'MuseumCheck/1.0 (Museum Add Workflow)' }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const pages = result.query?.pages || {};
          const images = Object.values(pages)
            .filter(page => page.imageinfo && page.imageinfo.length > 0)
            .map(page => ({
              title: page.title,
              url: page.imageinfo[0].url,
              thumbUrl: page.imageinfo[0].thumburl || page.imageinfo[0].url,
              width: page.imageinfo[0].width,
              height: page.imageinfo[0].height,
              pageUrl: page.fullurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`
            }));
          resolve(images);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

/**
 * 使用 Letmetry API 搜索图片
 */
async function searchLetmetryImages(keyword, count = 5) {
  try {
    const response = await fetch('https://letmetry.cloud/image/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, count })
    });
    const data = await response.json();
    return data.images || [];
  } catch (e) {
    return [];
  }
}

/**
 * 验证图片URL是否可访问
 */
async function validateImageUrl(url, timeout = 8000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * 生成博物馆ID（从中文名自动转换）
 */
function generateId(name) {
  const pinyinMap = {
    '中国': 'china', '国家': 'national', '博物': 'museum', '故宫': 'forbidden-city',
    '上海': 'shanghai', '北京': 'beijing', '南京': 'nanjing', '西安': 'xian',
    '湖北': 'hubei', '陕西': 'shaanxi', '苏州': 'suzhou', '浙江': 'zhejiang',
    '广东': 'guangdong', '四川': 'sichuan', '河南': 'henan', '辽宁': 'liaoning',
    '山东': 'shandong', '天津': 'tianjin', '西藏': 'tibet', '新疆': 'xinjiang',
    '云南': 'yunnan', '重庆': 'chongqing', '青海': 'qinghai', '黑龙江': 'heilongjiang',
    '广州': 'guangzhou', '深圳': 'shenzhen', '成都': 'chengdu', '杭州': 'hangzhou',
    '宁波': 'ningbo', '无锡': 'wuxi', '长沙': 'changsha', '岳阳': 'yueyang',
    '武汉': 'wuhan', '郑州': 'zhengzhou', '济南': 'jinan', '青岛': 'qingdao',
    '合肥': 'hefei', '南昌': 'nanchang', '福州': 'fuzhou', '厦门': 'xiamen',
    '昆明': 'kunming', '贵阳': 'guiyang', '南宁': 'nanning', '海口': 'haikou'
  };

  // 简单替换常见词
  let id = name.toLowerCase()
    .replace(/博物馆/g, '-museum')
    .replace(/博物院/g, '-museum')
    .replace(/纪念馆/g, '-memorial')
    .replace(/[\s·•]/g, '-');

  // 尝试替换已知城市名
  for (const [cn, en] of Object.entries(pinyinMap)) {
    if (name.includes(cn) && !id.includes(en)) {
      id = id.replace(new RegExp(cn, 'g'), en);
    }
  }

  // 清理
  id = id.replace(/^-+|-+$/g, '').replace(/-+/g, '-');

  if (!id) {
    // 如果无法转换，使用随机ID
    id = 'museum-' + Math.random().toString(36).substring(2, 8);
  }

  return id;
}

/**
 * 生成数据模板文件
 */
function generateTemplateFile(museum) {
  const templatePath = path.join(CONFIG.templatesDir, `${museum.id}.js`);

  const tagsStr = museum.tags.map(t => `    '${t}'`).join(',\n');

  const content = `/**
 * ${museum.name}数据
 * 位置：${museum.location}
 * ${museum.level ? museum.level + '博物馆' : '博物馆'}
 */

module.exports = {
  id: '${museum.id}',
  name: '${museum.name}',
  location: '${museum.location}',
  description: '${museum.description || ''}',

  tags: [
${tagsStr}
  ],

  image: '${museum.image || ''}',

  collections: [
    // 镇馆之宝请在此添加
    // {
    //   name: '文物名称',
    //   description: '简要描述',
    //   imageUrl: '图片URL（可使用 node tools/upload-image-to-cdn.js 上传）'
    // }
  ],

  workflows: []
};
`;

  fs.writeFileSync(templatePath, content, 'utf8');
  return templatePath;
}

/**
 * 更新 museums-meta.json
 */
function updateMetaFile(museum) {
  const museums = JSON.parse(fs.readFileSync(CONFIG.metaPath, 'utf8'));

  // 检查是否已存在
  const existingIndex = museums.findIndex(m => m.id === museum.id);

  const metaEntry = {
    id: museum.id,
    name: museum.name,
    location: museum.location,
    tags: museum.tags || [],
    image: museum.image || '',
    hasCollections: (museum.collections && museum.collections.length > 0) || false,
    level: museum.level || ''
  };

  if (existingIndex >= 0) {
    museums[existingIndex] = metaEntry;
  } else {
    museums.push(metaEntry);
  }

  fs.writeFileSync(CONFIG.metaPath, JSON.stringify(museums, null, 2), 'utf8');
}

/**
 * 重新生成 js/museums-meta.js
 */
function regenerateMetaJs() {
  const generateScript = path.join(__dirname, 'generate-museums-meta-js.js');
  if (fs.existsSync(generateScript)) {
    require(generateScript);
    return true;
  }
  return false;
}

/**
 * 上传数据到 KV Store
 */
async function uploadToKVStore(museumData) {
  const response = await fetch(CONFIG.kvEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: `museum-data-${museumData.id}`,
      sortKey: 'museum',
      value: JSON.stringify(museumData),
      expireAt: CONFIG.expireAt
    })
  });

  return response.ok;
}

/**
 * 搜索并推荐建筑照片
 */
async function searchBuildingPhotos(museumName) {
  log('\n🔍 正在搜索建筑照片...');

  // 1. 先尝试 Wikimedia Commons
  let images = [];
  try {
    images = await searchWikimediaImages(museumName, 5);
    if (images.length > 0) {
      log(`   ✅ Wikimedia Commons 找到 ${images.length} 张图片`);
    }
  } catch (e) {
    log(`   ⚠️ Wikimedia 搜索失败: ${e.message}`);
  }

  // 2. 如果 Wikimedia 没有，尝试 Letmetry API
  if (images.length === 0) {
    try {
      images = await searchLetmetryImages(`${museumName} 博物馆 建筑`, 5);
      if (images.length > 0) {
        log(`   ✅ Letmetry API 找到 ${images.length} 张图片`);
      }
    } catch (e) {
      log(`   ⚠️ Letmetry 搜索失败: ${e.message}`);
    }
  }

  // 3. 验证URL可访问性
  const validImages = [];
  for (const img of images.slice(0, 3)) {
    const url = img.thumbUrl || img.url;
    const isValid = await validateImageUrl(url);
    if (isValid) {
      validImages.push(img);
    }
  }

  if (validImages.length > 0) {
    log(`   ✅ ${validImages.length} 张图片验证通过`);
    log('\n📸 推荐图片（请复制URL到模板中）：');
    validImages.forEach((img, i) => {
      log(`   [${i + 1}] ${img.thumbUrl || img.url}`);
      if (img.pageUrl) log(`       来源: ${img.pageUrl}`);
    });
  } else {
    log('   ❌ 未找到可用的建筑照片');
    log('   💡 建议: 手动搜索后使用 tools/upload-image-to-cdn.js 上传');
  }

  return validImages;
}

// ============================================================================
// 主流程
// ============================================================================

async function main() {
  log('\n══════════════════════════════════════════════════════');
  log('🏛️  添加博物馆工作流');
  log('══════════════════════════════════════════════════════');
  log('');

  // 步骤1：收集基本信息
  const args = parseArgs();

  let museum = {
    id: args.id || '',
    name: args.name || '',
    location: args.location || '',
    level: args.level || '',
    image: args.image || '',
    description: args.description || '',
    tags: args.tags || [],
    collections: []
  };

  // 如果没有命令行参数，提示用户输入
  if (!museum.name) {
    log('📋 请输入博物馆基本信息（直接回车使用默认值）：\n');
    museum.name = await prompt('博物馆名称');
    if (!museum.name) {
      error('博物馆名称不能为空');
      process.exit(1);
    }
  }

  if (!museum.id) {
    const suggestedId = generateId(museum.name);
    museum.id = await prompt('唯一标识符（kebab-case）', suggestedId);
  }

  if (!museum.location) {
    museum.location = await prompt('所在城市');
  }

  if (!museum.level) {
    museum.level = await prompt('级别（一级/二级/三级/未评级）', '二级');
  }

  if (!museum.description) {
    museum.description = await prompt('简介', '');
  }

  if (!museum.tags || museum.tags.length === 0) {
    const tagsInput = await prompt('标签（用逗号分隔）', '历史,文化,文物');
    museum.tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
  }

  log('');
  log('══════════════════════════════════════════════════════');
  log('📊 确认信息');
  log('══════════════════════════════════════════════════════');
  log(`ID:       ${museum.id}`);
  log(`名称:     ${museum.name}`);
  log(`位置:     ${museum.location}`);
  log(`级别:     ${museum.level}`);
  log(`标签:     ${museum.tags.join(', ')}`);
  log(`简介:     ${museum.description || '(空)'}`);
  log('');

  // 步骤2：搜索建筑照片
  if (!museum.image) {
    const photos = await searchBuildingPhotos(museum.name);

    if (photos.length > 0) {
      const choice = await prompt('\n请选择一个图片URL（输入序号1/2/3，或直接粘贴URL）', '1');
      if (['1', '2', '3'].includes(choice) && photos[parseInt(choice) - 1]) {
        museum.image = photos[parseInt(choice) - 1].thumbUrl || photos[parseInt(choice) - 1].url;
      } else if (choice.startsWith('http')) {
        museum.image = choice;
      }
    }

    if (!museum.image) {
      museum.image = await prompt('请输入建筑照片URL（可后续补充）', '');
    }
  }

  // 步骤3：生成模板文件
  log('\n📝 正在生成数据模板...');
  const templatePath = generateTemplateFile(museum);
  success(`模板已创建: ${templatePath}`);

  // 步骤4：更新 meta 文件
  log('\n📝 正在更新 museums-meta.json...');
  updateMetaFile(museum);
  success('Meta 文件已更新');

  // 步骤5：重新生成 JS
  log('\n📝 正在重新生成 js/museums-meta.js...');
  if (regenerateMetaJs()) {
    success('JS 文件已重新生成');
  } else {
    warn('未找到生成脚本，请手动运行: node devops/tools/generate-museums-meta-js.js');
  }

  // 步骤6：上传到 KV Store
  log('\n💾 正在上传数据到 KV Store...');
  const kvData = {
    id: museum.id,
    name: museum.name,
    location: museum.location,
    description: museum.description,
    tags: museum.tags,
    image: museum.image,
    level: museum.level,
    hasCollections: false,
    collections: [],
    workflows: []
  };

  try {
    const uploaded = await uploadToKVStore(kvData);
    if (uploaded) {
      success('KV Store 上传成功');
    } else {
      error('KV Store 上传失败');
    }
  } catch (e) {
    error(`KV Store 上传出错: ${e.message}`);
  }

  // 完成
  log('\n══════════════════════════════════════════════════════');
  log('🎉 博物馆基础信息添加完成！');
  log('══════════════════════════════════════════════════════');
  log('');
  log('后续步骤：');
  log('1. 编辑模板文件补充镇馆之宝：');
  log(`   ${templatePath}`);
  log('');
  log('2. 搜索镇馆之宝图片并上传：');
  log('   node tools/upload-image-to-cdn.js <图片路径> --type treasure');
  log('');
  log('3. 补充完镇馆之宝后，重新运行：');
  log(`   node tools/collect-museum-data.js ${museum.id}`);
  log('');
}

main().catch(err => {
  error(err.message);
  process.exit(1);
});
