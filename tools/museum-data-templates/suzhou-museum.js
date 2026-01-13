/**
 * 苏州博物馆数据
 * 位置：苏州
 * 国家一级博物馆，中国古典园林文化的典范
 */

module.exports = {
  id: 'suzhou-museum',
  name: '苏州博物馆',
  location: '苏州',
  description: '苏州博物馆是中国地方综合性博物馆，馆藏文物5000余件。博物馆坐落在苏州古城中心，由著名建筑师贝聿铭设计。馆藏包括陶瓷、玉器、书画、古建筑等，展示了苏州地区悠久的历史文化和吴地特色。',
  
  tags: [
    '古典园林',
    '吴文化',
    '陶瓷',
    '玉器',
    '书画'
  ],
  
  // 苏州博物馆建筑，融合传统与现代元素，与拙政园相邻
  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Suzhou_Museum_2020.jpg/1280px-Suzhou_Museum_2020.jpg',
  
  // 三大镇馆之宝
  collections: [
    {
      name: '元青花大盘',
      description: '元代青花瓷器，直径超40厘米。青花料色纯正、清晰明亮，画工精细，描绘了古代名人故事。这是元青花瓷器的典范之作，体现了元代瓷器工艺的最高水平，是中国古代陶瓷艺术的杰出代表。',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Yuan_blue_and_white_plate.jpg/800px-Yuan_blue_and_white_plate.jpg'
    },
    {
      name: '明清家具精品',
      description: '苏州自古以来是家具制作中心，馆藏有大量明清时期的精美家具。其中包括雕花罗汉床、条纹楠木椅等，每件都是木雕工艺的艺术品。这些家具见证了苏州"吴中四才子"时代的文人雅韵。',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Chinese_Furniture_Qing_Dynasty.jpg/800px-Chinese_Furniture_Qing_Dynasty.jpg'
    },
    {
      name: '吴地玉器藏品',
      description: '苏州在新石器时代就有"玉石之路"的说法。馆藏新石器时代至清代的玉器200余件，包括玉璧、玉琮、玉佩等。这些玉器代表了长江流域玉文化的发展历程，是中国古代玉器艺术的重要见证。',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Neolithic_jade_cong.jpg/800px-Neolithic_jade_cong.jpg'
    }
  ],
  
  workflows: []
};
