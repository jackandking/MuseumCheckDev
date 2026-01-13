/**
 * 浙江省博物馆数据
 * 位置：杭州
 * 国家一级博物馆，古代越文化和南宋文化的重要展示地
 */

module.exports = {
  id: 'zhejiang-museum',
  name: '浙江省博物馆',
  location: '杭州',
  description: '浙江省博物馆是浙江地区最大的综合性博物馆，馆藏文物9万余件。馆内重点展示了古代越文化、南宋文化等浙江特色文化。博物馆拥有全国重点展厅，陈列展示了从新石器时代到近现代的浙江历史文明。',
  
  tags: [
    '古代文明',
    '陶瓷',
    '越文化',
    '南宋',
    '龙泉青瓷'
  ],
  
  // 浙江省博物馆建筑 - Wikimedia Commons免费授权图片
  image: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/%E6%B5%99%E6%B1%9F%E7%9C%81%E5%8D%9A%E7%89%A9%E9%A6%86_-_panoramio.jpg',
  
  // 三大镇馆之宝
  collections: [
    {
      name: '龙泉青瓷',
      description: '龙泉青瓷是中国古代著名的陶瓷品种，浙江省龙泉窑烧制。产品以釉色青翠晶莹著称，胎质细腻，釉色莹润，堪称"翠玉般的陶瓷"。馆藏龙泉青瓷包括各种器形，代表了中国古代陶瓷工艺的高超水平。',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Longquan_celadon_vase.jpg/800px-Longquan_celadon_vase.jpg'
    },
    {
      name: '越窑青瓷',
      description: '越窑是中国古代著名的青瓷窑口，位于浙江。越窑青瓷胎质细腻，色泽青翠，造型优雅，代表了中国古代陶瓷工艺的杰出成就。唐代越窑青瓷曾被日本遣唐使带回日本，是丝绸之路上的重要文物。',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Yuezhou_celadon_bowl.jpg/800px-Yuezhou_celadon_bowl.jpg'
    },
    {
      name: '南宋官窑瓷器',
      description: '南宋官窑是中国古代最为尊贵的皇家窑口，在杭州凤凰山。南宋官窑瓷器造型端庄，釉色油润，代表了南宋时期中国陶瓷工艺的最高水平。传世品极少，是中国古代陶瓷的瑰宝，被誉为"皇帝用瓷"。',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Song_Dynasty_Guan_ware.jpg/800px-Song_Dynasty_Guan_ware.jpg'
    }
  ],
  
  workflows: []
};
