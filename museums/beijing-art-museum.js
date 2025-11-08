window.MUSEUM_BEIJING_ART = {
  id: 'beijing-art-museum',
  name: '北京艺术博物馆',
  location: '北京',
  description: '展示中国传统艺术和文物的综合性博物馆',
  tags: ['传统艺术', '文物收藏', '历史文化'],
  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Beijing_Art_Museum.jpg/500px-Beijing_Art_Museum.jpg',
  collections: [
    {
      name: '永乐铜佛',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Bronze_Buddha.jpg/600px-Bronze_Buddha.jpg',
      description: '明代永乐年间铸造的铜佛像，工艺精湛，是研究明代佛教艺术的珍贵文物'
    },
    {
      name: '郎世宁《百骏图》',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Hundred_Horses.jpg/600px-Hundred_Horses.jpg',
      description: '清代宫廷画家郎世宁的代表作，融合中西绘画技法，描绘了百匹骏马的生动场景'
    },
    {
      name: '青花釉里红瓷罐',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Blue_White_Porcelain_Jar.jpg/400px-Blue_White_Porcelain_Jar.jpg',
      description: '元代青花釉里红瓷器，烧制工艺复杂，是中国陶瓷史上的艺术珍品'
    }
  ],
  workflows: [
    {
      id: 'treasure-discovery',
      name: '镇馆之宝探索',
      description: '围绕北京艺术博物馆三大镇馆之宝的亲子探索路线',
      ages: ['3-6', '7-12', '13-18'],
      tasks: [
        { id: 'gate-photo', role: 'parent', type: 'photo', title: '门口打卡', subtitle: '在北京艺术博物馆门口拍一张照片', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-1', role: 'child', type: 'photo', title: '镇馆之宝 1/3', subtitle: '找到「永乐铜佛」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Bronze_Buddha.jpg/600px-Bronze_Buddha.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-2', role: 'child', type: 'photo', title: '镇馆之宝 2/3', subtitle: '找到「郎世宁《百骏图》」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Hundred_Horses.jpg/600px-Hundred_Horses.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-3', role: 'child', type: 'photo', title: '镇馆之宝 3/3', subtitle: '找到「青花釉里红瓷罐」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Blue_White_Porcelain_Jar.jpg/400px-Blue_White_Porcelain_Jar.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'victory-photo', role: 'parent', type: 'photo', title: '完成合影', subtitle: '和家长比心/拥抱/击掌，留下美好瞬间！', ages: ['3-6','7-12','13-18'] },
        { id: 'poster', role: 'parent', type: 'poster', title: '成就海报', subtitle: '生成专属成就海报', ages: ['3-6','7-12','13-18'] }
      ]
    }
  ],
  checklists: {
    parent: {
      '3-6': [
        '📸 门口打卡：家长给孩子在北京艺术博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「永乐铜佛」并合影',
        '🏺 镇馆之宝：找到「郎世宁《百骏图》」并合影',
        '🏺 镇馆之宝：找到「青花釉里红瓷罐」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '7-12': [
        '📸 门口打卡：家长给孩子在北京艺术博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「永乐铜佛」并合影',
        '🏺 镇馆之宝：找到「郎世宁《百骏图》」并合影',
        '🏺 镇馆之宝：找到「青花釉里红瓷罐」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '13-18': [
        '📸 门口打卡：家长给孩子在北京艺术博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「永乐铜佛」并合影',
        '🏺 镇馆之宝：找到「郎世宁《百骏图》」并合影',
        '🏺 镇馆之宝：找到「青花釉里红瓷罐」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ]
    },
    child: {
      '3-6': [
        '📸 门口打卡：家长给孩子在北京艺术博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「永乐铜佛」并合影',
        '🏺 镇馆之宝：找到「郎世宁《百骏图》」并合影',
        '🏺 镇馆之宝：找到「青花釉里红瓷罐」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '7-12': [
        '📸 门口打卡：家长给孩子在北京艺术博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「永乐铜佛」并合影',
        '🏺 镇馆之宝：找到「郎世宁《百骏图》」并合影',
        '🏺 镇馆之宝：找到「青花釉里红瓷罐」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '13-18': [
        '📸 门口打卡：家长给孩子在北京艺术博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「永乐铜佛」并合影',
        '🏺 镇馆之宝：找到「郎世宁《百骏图》」并合影',
        '🏺 镇馆之宝：找到「青花釉里红瓷罐」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ]
    }
  }
};
