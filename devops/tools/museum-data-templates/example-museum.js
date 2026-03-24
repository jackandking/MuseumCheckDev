/**
 * 博物馆数据模板 - 示例
 * 
 * 这是一个示例模板，展示如何准备博物馆数据。
 * 复制此文件并重命名为你的博物馆ID（例如：forbidden-city.js）
 * 
 * 数据结构要求：
 * - id: 唯一标识符（kebab-case格式，如 "forbidden-city"）
 * - name: 中文名称（如 "故宫博物院"）
 * - location: 城市名称（如 "北京"）
 * - description: 博物馆简介
 * - tags: 标签数组（如 ["历史", "建筑", "文物"]）
 * - image: 博物馆建筑照片URL（推荐使用Wikimedia Commons）
 * - collections: 镇馆之宝数组（可选但推荐，3-5个）
 * - workflows: 工作流数组（可选，通常为空）
 * 
 * 图片来源推荐（按优先级）：
 * 1. Wikimedia Commons（免费授权，高质量）
 *    - 使用: node tools/search-museum-images-wikimedia.js "博物馆名称"
 * 2. 博物馆官方网站（需验证授权）
 * 3. 图片代理/CDN服务
 * 
 * 验证：
 * - 所有图片URL将在上传前验证
 * - 无效URL会被自动移除
 * - 工具会显示验证结果
 * 
 * 使用方法：
 *   1. 复制此文件: cp example-museum.js your-museum-id.js
 *   2. 填写下方的博物馆数据
 *   3. 运行: node tools/collect-museum-data.js your-museum-id
 */

module.exports = {
  // 基本信息
  id: 'example-museum',
  name: '示例博物馆',
  location: '北京',
  description: '这是一个示例博物馆，展示如何准备博物馆数据。请替换为实际的博物馆信息。国家一级博物馆，创建于XXXX年。',
  
  // 标签（推荐3-5个）
  tags: [
    '历史',
    '文化',
    '艺术'
  ],
  
  // 博物馆建筑图片
  // 优先使用Wikimedia Commons图片以确保授权合规
  // 示例: https://upload.wikimedia.org/wikipedia/commons/...
  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Forbidden_City_Beijing.jpg/1280px-Forbidden_City_Beijing.jpg',
  
  // 镇馆之宝（推荐3-5个）
  // 每个藏品应包含：
  // - name: 中文名称
  // - description: 简要描述（1-2句话）
  // - imageUrl: 高质量照片URL
  collections: [
    {
      name: '镇馆之宝示例一',
      description: '这是第一件镇馆之宝的描述。包括历史背景、年代、尺寸、艺术价值等信息。例如：商代晚期青铜器，重832公斤，是世界上现存最大最重的青铜器。',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Example_artifact.jpg/800px-Example_artifact.jpg'
    },
    {
      name: '镇馆之宝示例二',
      description: '这是第二件镇馆之宝的描述。可以包含制作工艺、文化意义、发现过程等内容。描述应该简洁明了，适合儿童和家长阅读。',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Example_artifact2.jpg/800px-Example_artifact2.jpg'
    },
    {
      name: '镇馆之宝示例三',
      description: '这是第三件镇馆之宝的描述。重点突出其独特性和重要性，让访客对参观产生兴趣。可以提及"国宝级文物"、"镇馆之宝"等吸引人的标签。',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Example_artifact3.jpg/800px-Example_artifact3.jpg'
    }
  ],
  
  // 工作流（可选，通常为空数组）
  // 未来可能用于定义特定的参观流程或教育活动
  workflows: []
};

/**
 * 快速开始指南：
 * 
 * 1. 搜索博物馆建筑照片：
 *    node tools/search-museum-images-wikimedia.js "故宫博物院"
 * 
 * 2. 搜索镇馆之宝照片：
 *    node tools/search-museum-images-wikimedia.js "故宫博物院" "清明上河图"
 * 
 * 3. 将找到的URL复制到此模板
 * 
 * 4. 验证并上传：
 *    node tools/collect-museum-data.js example-museum
 * 
 * 5. 检查结果：
 *    - 访问: https://museumcheck.cn（或本地开发服务器）
 *    - 搜索你的博物馆
 *    - 验证图片是否正确加载
 * 
 * 提示：
 * - 保持描述简洁（1-2句话，50-100字）
 * - 使用高质量图片（宽度800px以上）
 * - 验证图片授权（Wikimedia Commons最安全）
 * - 提交前测试图片URL
 * - 如果不确定检查清单内容，可以先不添加
 * 
 * 数据质量标准：
 * - ✅ 描述准确，无错别字
 * - ✅ 图片清晰，加载快速
 * - ✅ URL稳定，长期可访问
 * - ✅ 内容适合家庭和儿童
 * - ✅ 信息来源可靠
 */
