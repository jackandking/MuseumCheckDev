/**
 * 中国闽台缘博物馆数据模板
 * 
 * 官方信息：
 * - 名称：中国闽台缘博物馆
 * - 等级：国家一级博物馆
 * - 省份：福建省
 * - 城市：泉州市
 * - 地址：福建省泉州市丰泽区北清东路300号
 * - 开馆：2006年
 * - 主题：展示闽台两地人民同根同源、同祖同宗的历史渊源与文化联系
 */

module.exports = {
  // 基本信息
  id: 'china-mintaiyuan-museum',
  name: '中国闽台缘博物馆',
  location: '福建',
  description: '中国闽台缘博物馆是国家一级博物馆，2006年开馆，位于福建省泉州市。博物馆以"同根、同祖、同源"为主题，系统展示了闽台两地人民在血缘、地缘、文缘、商缘和法缘上的紧密联系，是两岸文化交流与研究的重要基地。',

  // 标签
  tags: [
    '历史',
    '文化',
    '闽台关系',
    '民俗',
    '闽南文化'
  ],

  // 博物馆建筑图片
  image: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Mintaiyuan_Museum.jpg',

  // 代表性藏品
  collections: [
    {
      name: '闽台族谱文献',
      description: '珍藏了大量记录闽台两地宗族渊源的族谱文献，展示了闽南先民渡海赴台的历史足迹及两岸同宗同族的血脉联系，是研究闽台移民史的重要原始资料。',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Genealogy_book.jpg/800px-Genealogy_book.jpg'
    },
    {
      name: '开漳圣王神像',
      description: '开漳圣王陈元光是唐代将领，率军开发漳州，被闽台两地民众奉为神明祭祀。这尊神像是闽台民间信仰同根同源的重要见证，体现了两岸共同的文化信仰传统。',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Taiwan_temple.jpg/800px-Taiwan_temple.jpg'
    },
    {
      name: '闽南民俗器物',
      description: '收藏有大量闽南传统民俗生活器物，包括服饰、农具、生活用品等，展现了闽南文化的丰富内涵，以及这些文化习俗如何随移民潮传入台湾并在两岸间传承延续。',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Minnan_culture_objects.jpg/800px-Minnan_culture_objects.jpg'
    }
  ],

  // 工作流
  workflows: []
};
