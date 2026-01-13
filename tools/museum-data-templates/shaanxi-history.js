/**
 * 陕西历史博物馆数据
 * 位置：西安
 * 国家一级博物馆，中国最重要的历史博物馆之一
 */

module.exports = {
  id: 'shaanxi-history',
  name: '陕西历史博物馆',
  location: '西安',
  description: '陕西历史博物馆是中国最重要的历史文化艺术博物馆之一，馆藏文物370多万件，涵盖了从远古人类初始阶段到1840年鸦片战争爆发前的历史时期，被誉为"华夏文明的瑰宝，民族智慧的象征"。',
  
  tags: [
    '历史',
    '古代文明',
    '文物',
    '唐朝',
    '周朝'
  ],
  
  // 博物馆建筑：陕西历史博物馆，建筑风格融现代建筑与传统建筑特色
  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Shaanxi_History_Museum_02.jpg/1280px-Shaanxi_History_Museum_02.jpg',
  
  // 三大镇馆之宝（与兵马俑并列的顶级文物）
  collections: [
    {
      name: '唐三彩俑群',
      description: '唐代文物，是古代陶艺工艺的巅峰之作。唐三彩采用釉下彩的方式进行点缀，以黄、绿、白为基本色系，是唐代社会发展水平和艺术水平的象征。陕西历史博物馆藏有数百件唐三彩陶俑，品种繁多，形象栩栩如生。',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Chinese_Sancai_horse_Tang_dynasty.jpg/800px-Chinese_Sancai_horse_Tang_dynasty.jpg'
    },
    {
      name: '杜虎符',
      description: '战国时期的古代虎形兵符，是验证军权、统率军队的凭证。用黄金铸造，虎形，通长17厘米，腹部可以打开。这是中国古代兵权管理制度最直接的物质证明，具有极高的历史和文物价值。',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Tiger_Tally_Fragment_02.jpg/800px-Tiger_Tally_Fragment_02.jpg'
    },
    {
      name: '昭陵六骏石雕',
      description: '唐太宗昭陵的六匹骏马石浮雕，是中国古代石雕艺术的杰作。每匹马都有不同的表情和姿态，栩栩如生，堪称唐代石雕艺术的瑰宝。现存的三匹（拨山鼠、飒露紫、青骓）是世界文化遗产的重要组成部分。',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Qingzhi_Horse_relief_Tang_Dynasty.jpg/800px-Qingzhi_Horse_relief_Tang_Dynasty.jpg'
    }
  ],
  
  workflows: []
};
