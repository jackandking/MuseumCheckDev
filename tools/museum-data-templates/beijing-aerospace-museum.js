/**
 * 北京航空航天博物馆数据
 * 位置：北京
 * 中国首个航空航天科学技术综合性博物馆
 */

module.exports = {
  id: 'beijing-aerospace-museum',
  name: '北京航空航天博物馆',
  location: '北京',
  description: '北京航空航天博物馆是中国首个航空航天科学技术综合性博物馆，位于北京航空航天大学校内。博物馆收藏了300多架航空航天器，展示了中国航空航天事业从起步到腾飞的辉煌历程，是全国科普教育基地和青少年科技教育基地。',
  
  tags: [
    '航空',
    '航天',
    '科技',
    '历史',
    '军事'
  ],
  
  // 博物馆建筑图片 - 来自 Wikimedia Commons
  image: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Beijing_Air_and_Space_Museum.jpg',
  
  // 三大镇馆之宝（代表性藏品）
  collections: [
    {
      name: 'P-61"黑寡妇"夜间战斗机',
      description: '美国二战时期研制的双引擎夜间战斗机，是世界上第一种专门设计的夜间战斗机。该机配备了当时最先进的机载雷达系统，在太平洋战场上发挥了重要作用。这架飞机是北京航空航天博物馆的镇馆之宝，也是亚洲唯一展出的P-61战斗机实体。',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Black_Widow_in_Beijing_Air_and_Space_Museum.jpg'
    },
    {
      name: 'P-47"雷电"战斗机',
      description: '美国二战时期的重型战斗机，以其坚固的机体和强大的火力著称。该机参加了欧洲和太平洋战场的多次重要战役，是二战期间产量最大的美国战斗机之一。馆藏的这架P-47战斗机保存完好，展现了二战时期航空技术的巅峰水平。',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/P-47_in_Beijing_Air_and_Space_Museum.jpg'
    },
    {
      name: '歼-5战斗机',
      description: '中国第一种国产喷气式战斗机，仿制自苏联的米格-17。歼-5于1956年首飞成功，标志着中国航空工业进入了喷气时代。这架战斗机见证了新中国航空工业从无到有的历史进程，对中国空军现代化建设具有重要的历史意义。',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/93/%E7%A9%BA%E5%86%9B%E6%96%B0%E7%96%86%E8%88%AA%E7%A9%BA%E9%98%9F%E7%BA%AA%E5%BF%B5%E9%A6%86%E6%89%80%E5%B1%95%E5%87%BA%E7%9A%84%E6%AD%BC-5%E6%88%98%E6%96%97%E6%9C%BA.jpg'
    }
  ],
  
  workflows: []
};
