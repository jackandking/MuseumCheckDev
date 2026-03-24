#!/usr/bin/env node

/**
 * 博物馆图片搜索完整工具 - 权威媒体优先 + Letmetry API降级
 * 
 * 功能流程：
 * 1. 优先尝试权威媒体（维基百科、官方网站）
 * 2. 如果失败，降级到Letmetry API
 * 3. 验证所有URL可访问性
 * 4. 返回带来源标注的推荐结果
 * 
 * 用法：
 *   node tools/search-museum-complete.js "浙江省博物馆" "杭州"
 */

// 尝试加载集中配置
let API_ENDPOINTS;
try { API_ENDPOINTS = require('../config/api-endpoints.js'); } catch(e) {}

// ============================================================================
// 权威媒体搜索模块
// ============================================================================

/**
 * 从维基百科API搜索图片
 */
async function searchWikipedia(museumName) {
  console.log(`\n📖 维基百科搜索: "${museumName}"...`);
  
  try {
    // 尝试多种名称变化
    const variations = [
      museumName,
      `${museumName} Museum`,
      museumName.replace(/博物馆|博物院/, 'Museum')
    ];
    
    for (const searchTerm of variations) {
      const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(searchTerm)}&prop=pageimages&pithumbsize=800&redirects=1&format=json`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.query || !data.query.pages) continue;
      
      const pages = Object.values(data.query.pages);
      for (const page of pages) {
        if (page.thumbnail) {
          console.log(`   ✅ 找到维基百科图片`);
          return {
            source: 'wikipedia',
            sourceUrl: `https://en.wikipedia.org/wiki/${page.title}`,
            imageUrl: page.thumbnail.source,
            description: `维基百科 - ${page.title}`
          };
        }
      }
    }
    
    console.log('   ⚠️  维基百科未找到');
    return null;
  } catch (error) {
    console.log(`   ❌ 维基百科错误: ${error.message}`);
    return null;
  }
}

/**
 * 从Wikimedia Commons搜索图片（高质量免费图片源）
 */
async function searchWikimediaCommons(museumName, location) {
  console.log(`\n🌍 Wikimedia Commons搜索: "${museumName}"...`);
  
  try {
    const searchTerms = [
      `${museumName} museum`,
      `${location} museum`,
      `${museumName} 博物馆`,
      `${museumName} building`
    ];
    
    for (const searchTerm of searchTerms) {
      // Wikimedia Commons API搜索
      const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srnamespace=6&format=json&srlimit=5`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.query || !data.query.search || data.query.search.length === 0) {
        continue;
      }
      
      // 获取第一个搜索结果的图片信息
      const firstResult = data.query.search[0];
      const fileTitle = firstResult.title;
      
      // 获取文件详情（包括图片URL）
      const fileUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url&format=json`;
      const fileResponse = await fetch(fileUrl);
      const fileData = await fileResponse.json();
      
      const pages = Object.values(fileData.query.pages);
      if (pages.length > 0 && pages[0].imageinfo) {
        const imageUrl = pages[0].imageinfo[0].url;
        console.log(`   ✅ 找到Wikimedia Commons图片`);
        return {
          source: 'wikimedia-commons',
          sourceUrl: `https://commons.wikimedia.org/wiki/${fileTitle}`,
          imageUrl: imageUrl,
          description: `Wikimedia Commons - 免费授权图片`
        };
      }
    }
    
    console.log('   ⚠️  Wikimedia Commons未找到');
    return null;
  } catch (error) {
    console.log(`   ❌ Wikimedia Commons错误: ${error.message}`);
    return null;
  }
}

// ============================================================================
// Letmetry API搜索模块（降级方案）
// ============================================================================

/**
 * 使用Letmetry API搜索图片
 */
async function searchWithLetmetry(museumName, location) {
  console.log(`\n🔍 Letmetry API搜索: "${museumName}"...`);
  
  try {
    const searchTerms = [
      `${museumName} 博物馆外观`,
      `${museumName} 建筑`,
      `${location} ${museumName}`,
      `${museumName} museum building`
    ];
    
    for (const keyword of searchTerms) {
      console.log(`   📝 关键词: "${keyword}"`);
      
      const endpoint = API_ENDPOINTS ? API_ENDPOINTS.IMAGE.SEARCH : 'https://letmetry.cloud/image/search';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, count: 10 })
      });
      
      if (!response.ok) {
        console.log(`   ⚠️  API错误 ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (data.success && data.images && data.images.length > 0) {
        console.log(`   ✅ 找到 ${data.images.length} 张图片`);
        return {
          source: 'letmetry-api',
          sourceUrl: API_ENDPOINTS ? API_ENDPOINTS.BASE_URL : 'https://letmetry.cloud',
          imageUrls: data.images,
          description: 'Letmetry API搜索结果'
        };
      }
    }
    
    console.log('   ⚠️  Letmetry API未找到');
    return null;
  } catch (error) {
    console.log(`   ❌ Letmetry API错误: ${error.message}`);
    return null;
  }
}

// ============================================================================
// URL验证模块
// ============================================================================

/**
 * 验证单个图片URL
 */
async function validateImageUrl(url, timeout = 8000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * 批量验证图片URL
 */
async function validateImages(imageUrls, maxResults = 5) {
  console.log(`\n✓ 验证 ${imageUrls.length} 个图片URL...`);
  
  const results = [];
  for (let i = 0; i < Math.min(imageUrls.length, maxResults); i++) {
    const url = imageUrls[i];
    const isValid = await validateImageUrl(url);
    
    if (isValid) {
      console.log(`  ✅ [${i + 1}] ${url.substring(0, 70)}...`);
      results.push(url);
    } else {
      console.log(`  ❌ [${i + 1}] ${url.substring(0, 70)}...`);
    }
  }
  
  return results;
}

// ============================================================================
// 主搜索流程
// ============================================================================

/**
 * 完整的博物馆图片搜索流程
 */
async function searchMuseumImage(museumName, location) {
  console.log('\n' + '='.repeat(70));
  console.log(`🏛️  完整搜索: ${museumName} (${location})`);
  console.log('='.repeat(70));
  
  // 优先级 1: 维基百科（质量最高）
  console.log('\n📊 搜索优先级: 维基百科 > Wikimedia Commons > Letmetry API');
  
  let result = await searchWikipedia(museumName);
  if (result) {
    const isValid = await validateImageUrl(result.imageUrl);
    if (isValid) {
      return { ...result, validated: true };
    }
  }
  
  // 优先级 2: Wikimedia Commons（免费授权）
  result = await searchWikimediaCommons(museumName, location);
  if (result) {
    const isValid = await validateImageUrl(result.imageUrl);
    if (isValid) {
      return { ...result, validated: true };
    }
  }
  
  // 优先级 3: Letmetry API（降级方案）
  result = await searchWithLetmetry(museumName, location);
  if (result && result.imageUrls) {
    const validUrls = await validateImages(result.imageUrls, 3);
    if (validUrls.length > 0) {
      return { ...result, imageUrls: validUrls, validated: true };
    }
  }
  
  return { success: false, reason: '所有搜索都失败了' };
}

// ============================================================================
// 结果呈现
// ============================================================================

function presentResults(result, museumName, location) {
  console.log('\n' + '='.repeat(70));
  
  if (result.success === false || !result.validated) {
    console.log('❌ 搜索失败');
    console.log('='.repeat(70));
    console.log(`\n❌ 无法为 "${museumName}" 找到有效图片`);
    console.log(`💡 建议: 手动搜索或检查博物馆官方网站`);
    return;
  }
  
  console.log('🎉 搜索成功！');
  console.log('='.repeat(70));
  
  console.log(`\n📍 博物馆: ${museumName}`);
  console.log(`📍 位置: ${location}`);
  console.log(`\n📚 来源: ${result.description}`);
  console.log(`🔗 原始链接: ${result.sourceUrl}`);
  
  if (result.imageUrl) {
    // 单个图片结果
    console.log(`\n✅ 推荐图片URL:`);
    console.log(`   ${result.imageUrl}`);
  } else if (result.imageUrls && result.imageUrls.length > 0) {
    // 多个图片结果
    console.log(`\n✅ 推荐图片URL (共${result.imageUrls.length}个):`);
    console.log(`   ${result.imageUrls[0]}`);
    
    if (result.imageUrls.length > 1) {
      console.log(`\n🔄 备选图片:`);
      result.imageUrls.slice(1, 4).forEach((url, i) => {
        console.log(`   ${i + 2}. ${url}`);
      });
    }
  }
  
  console.log('\n' + '='.repeat(70));
}

// ============================================================================
// 主程序入口
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(`
博物馆图片完整搜索工具 (权威媒体优先 + API降级)

用法: node tools/search-museum-complete.js <museum-name> [location]

示例:
  node tools/search-museum-complete.js "浙江省博物馆" "杭州"
  node tools/search-museum-complete.js "故宫博物院" "北京"
  node tools/search-museum-complete.js "National Museum of China"

搜索优先级:
  1. 维基百科 (Highest quality)
  2. Wikimedia Commons (Free licensed)
  3. Letmetry API (Fallback)
    `);
    return;
  }
  
  const museumName = args[0];
  const location = args[1] || '未知';
  
  try {
    const result = await searchMuseumImage(museumName, location);
    presentResults(result, museumName, location);
    
    return result;
  } catch (error) {
    console.error('\n❌ 致命错误:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  searchWikipedia,
  searchWikimediaCommons,
  searchWithLetmetry,
  validateImageUrl,
  validateImages,
  searchMuseumImage,
  presentResults
};
