#!/usr/bin/env node

/**
 * 增强版博物馆图片搜索工具
 * 
 * 功能流程：
 * 1. 优先从权威媒体（百度百科、维基百科）提取图片
 * 2. 如果失败，降级到Letmetry API搜索
 * 3. 验证所有URL可访问性
 * 4. 返回带来源标注的推荐结果
 * 
 * 用法：
 *   node tools/search-museum-with-authorities.js "浙江省博物馆" "杭州"
 */

const https = require('https');

// ============================================================================
// 配置
// ============================================================================

const CONFIG = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  timeout: 10000,
  validationTimeout: 8000
};

// ============================================================================
// 权威媒体爬取模块
// ============================================================================

/**
 * 从百度百科提取博物馆图片
 */
async function extractFromBaiduBaike(museumName) {
  console.log(`\n🔍 尝试从百度百科提取 "${museumName}" 的图片...`);
  
  try {
    // 构建百度百科搜索URL
    const searchUrl = `https://baike.baidu.com/item/${encodeURIComponent(museumName)}`;
    console.log(`   URL: ${searchUrl}`);
    
    const html = await fetchUrl(searchUrl);
    
    if (!html) {
      console.log('   ❌ 无法获取页面内容');
      return null;
    }
    
    // 提取infobox中的图片（通常是博物馆建筑）
    // 百度百科infobox格式: <img src="xxx" ... class="pic">
    const imgMatches = html.match(/<img[^>]*src="([^"]*)"[^>]*class="[^"]*pic[^"]*"[^>]*>/gi);
    
    if (imgMatches && imgMatches.length > 0) {
      const urls = [];
      for (const match of imgMatches) {
        const srcMatch = match.match(/src="([^"]*)"/);
        if (srcMatch && srcMatch[1]) {
          // 确保URL是完整的
          let url = srcMatch[1];
          if (url.startsWith('//')) {
            url = 'https:' + url;
          } else if (!url.startsWith('http')) {
            url = 'https://baike.baidu.com' + url;
          }
          urls.push(url);
        }
      }
      
      if (urls.length > 0) {
        console.log(`   ✅ 找到 ${urls.length} 张图片`);
        return {
          source: 'baidu-baike',
          sourceUrl: searchUrl,
          imageUrls: urls,
          description: '来自百度百科'
        };
      }
    }
    
    // 尝试提取引言区域的第一张图片
    const leadImgMatch = html.match(/<div[^>]*id="lemma-summary[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"/);
    if (leadImgMatch && leadImgMatch[1]) {
      let url = leadImgMatch[1];
      if (url.startsWith('//')) {
        url = 'https:' + url;
      }
      console.log(`   ✅ 找到引言区域图片`);
      return {
        source: 'baidu-baike',
        sourceUrl: searchUrl,
        imageUrls: [url],
        description: '来自百度百科引言'
      };
    }
    
    console.log('   ⚠️  未找到相关图片');
    return null;
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
    return null;
  }
}

/**
 * 从维基百科提取图片
 */
async function extractFromWikipedia(museumName) {
  console.log(`\n🔍 尝试从维基百科提取 "${museumName}" 的图片...`);
  
  try {
    // 构建维基百科API URL
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(museumName)}&prop=pageimages|pageterms&pithumbsize=500&redirects=1&format=json`;
    console.log(`   API: Wikipedia`);
    
    const response = await fetchJson(apiUrl);
    
    if (!response || !response.query || !response.query.pages) {
      console.log('   ❌ 无法查询维基百科');
      return null;
    }
    
    const pages = response.query.pages;
    const page = Object.values(pages)[0];
    
    if (page.thumbnail && page.thumbnail.source) {
      console.log(`   ✅ 找到图片: ${page.title}`);
      return {
        source: 'wikipedia',
        sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
        imageUrls: [page.thumbnail.source],
        description: `来自维基百科 (${page.title})`
      };
    }
    
    console.log('   ⚠️  未找到缩略图');
    return null;
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
    return null;
  }
}

/**
 * 从官方网站检测图片URL
 */
async function detectFromOfficialSite(museumName, location) {
  console.log(`\n🔍 尝试从官方网站检测图片...`);
  
  try {
    // 常见的官方网站URL模式
    const patterns = [
      `https://${pinyin(museumName)}.org`,
      `https://${pinyin(museumName)}.com`,
      `https://www.${pinyin(museumName)}.org`,
      `https://www.${pinyin(museumName)}.com`
    ];
    
    // 常见的博物馆图片路径
    const imgPaths = [
      '/images/museum.jpg',
      '/img/logo.png',
      '/assets/building.jpg'
    ];
    
    for (const pattern of patterns) {
      for (const imgPath of imgPaths) {
        const url = pattern + imgPath;
        const isValid = await validateImageUrl(url);
        if (isValid) {
          console.log(`   ✅ 找到图片: ${url}`);
          return {
            source: 'official-site',
            sourceUrl: pattern,
            imageUrls: [url],
            description: '来自官方网站'
          };
        }
      }
    }
    
    console.log('   ⚠️  未找到官方网站图片');
    return null;
  } catch (error) {
    console.log(`   ⚠️  官方网站检测失败: ${error.message}`);
    return null;
  }
}

// ============================================================================
// 网络请求工具
// ============================================================================

/**
 * 获取URL内容
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, CONFIG.timeout);
    
    const urlObj = new URL(url);
    const client = url.startsWith('https') ? https : require('http');
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': CONFIG.userAgent,
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      },
      timeout: CONFIG.timeout
    };
    
    const request = client.request(options, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        clearTimeout(timeoutId);
        if (response.statusCode === 200) {
          resolve(data);
        } else {
          resolve(null);
        }
      });
    });
    
    request.on('error', (error) => {
      clearTimeout(timeoutId);
      resolve(null);
    });
    
    request.end();
  });
}

/**
 * 获取JSON数据
 */
async function fetchJson(url) {
  const content = await fetchUrl(url);
  if (content) {
    return JSON.parse(content);
  }
  return null;
}

/**
 * 验证图片URL可访问性
 */
function validateImageUrl(url, timeout = CONFIG.validationTimeout) {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve(false);
    }, timeout);
    
    try {
      const urlObj = new URL(url);
      const client = url.startsWith('https') ? https : require('http');
      
      const request = client.request(
        {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: 'HEAD',
          headers: { 'User-Agent': CONFIG.userAgent }
        },
        (response) => {
          clearTimeout(timeoutId);
          resolve(response.statusCode === 200);
        }
      );
      
      request.on('error', () => {
        clearTimeout(timeoutId);
        resolve(false);
      });
      
      request.end();
    } catch (error) {
      clearTimeout(timeoutId);
      resolve(false);
    }
  });
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 中文转拼音（简化版）
 */
function pinyin(text) {
  const map = {
    '浙江': 'zhejiang',
    '故宫': 'gugong',
    '博物馆': 'museum',
    '博物院': 'museum',
    '省': 'prov'
  };
  
  let result = text;
  for (const [key, value] of Object.entries(map)) {
    result = result.replace(key, value);
  }
  return result.toLowerCase();
}

/**
 * 权威媒体搜索流程
 */
async function searchFromAuthoritySources(museumName, location) {
  console.log('\n' + '='.repeat(70));
  console.log(`🏛️  从权威媒体搜索: ${museumName} (${location})`);
  console.log('='.repeat(70));
  
  // 优先级：百度百科 > 维基百科 > 官方网站
  
  // 1. 尝试百度百科
  const baiduResult = await extractFromBaiduBaike(museumName);
  if (baiduResult) {
    return baiduResult;
  }
  
  // 2. 尝试维基百科
  const wikiResult = await extractFromWikipedia(museumName);
  if (wikiResult) {
    return wikiResult;
  }
  
  // 3. 尝试官方网站
  const officialResult = await detectFromOfficialSite(museumName, location);
  if (officialResult) {
    return officialResult;
  }
  
  console.log('\n⚠️  权威媒体搜索失败，需要使用备用搜索');
  return null;
}

/**
 * 验证和过滤图片URL
 */
async function validateImages(imageUrls) {
  console.log(`\n✓ 验证 ${imageUrls.length} 个图片URL...`);
  
  const validUrls = [];
  for (const url of imageUrls) {
    const isValid = await validateImageUrl(url);
    if (isValid) {
      console.log(`  ✅ ${url.substring(0, 70)}...`);
      validUrls.push(url);
    } else {
      console.log(`  ❌ ${url.substring(0, 70)}...`);
    }
  }
  
  return validUrls;
}

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(`
用法: node tools/search-museum-with-authorities.js <museum-name> [location]

示例:
  node tools/search-museum-with-authorities.js "浙江省博物馆" "杭州"
  node tools/search-museum-with-authorities.js "故宫博物院"
    `);
    return;
  }
  
  const museumName = args[0];
  const location = args[1] || '未知';
  
  try {
    // 从权威媒体搜索
    const authorityResult = await searchFromAuthoritySources(museumName, location);
    
    if (authorityResult && authorityResult.imageUrls.length > 0) {
      // 验证图片URL
      const validUrls = await validateImages(authorityResult.imageUrls);
      
      if (validUrls.length > 0) {
        console.log('\n' + '='.repeat(70));
        console.log('🎉 成功！');
        console.log('='.repeat(70));
        console.log(`\n📍 博物馆: ${museumName}`);
        console.log(`📍 位置: ${location}`);
        console.log(`\n📚 来源: ${authorityResult.description}`);
        console.log(`🔗 链接: ${authorityResult.sourceUrl}`);
        console.log(`\n✅ 推荐图片URL:`);
        console.log(`   ${validUrls[0]}`);
        
        if (validUrls.length > 1) {
          console.log(`\n🔄 备选图片 (${validUrls.length - 1} 个):`);
          validUrls.slice(1, 4).forEach((url, i) => {
            console.log(`   ${i + 2}. ${url}`);
          });
        }
        
        console.log('\n' + '='.repeat(70));
        return { success: true, urls: validUrls, ...authorityResult };
      }
    }
    
    console.log('\n⚠️  权威媒体搜索完成但未找到有效图片');
    console.log('💡 提示: 可以使用 museum-photo-search skill 进行Letmetry API搜索');
    return { success: false, reason: '无有效图片' };
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    return { success: false, error: error.message };
  }
}

// 执行
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 致命错误:', error);
    process.exit(1);
  });
}

module.exports = {
  extractFromBaiduBaike,
  extractFromWikipedia,
  detectFromOfficialSite,
  searchFromAuthoritySources,
  validateImageUrl,
  validateImages,
  fetchUrl,
  fetchJson
};
