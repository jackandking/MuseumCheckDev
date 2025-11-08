window.MUSEUM_CHINA_RAILWAY = {
  id: 'china-railway-museum',
  name: '中国铁道博物馆',
  location: '北京',
  description: '展示中国铁路发展历史的专业博物馆',
  tags: ['铁路历史', '交通运输', '工业遗产'],
  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/China_Railway_Museum.jpg/500px-China_Railway_Museum.jpg',
  collections: [
    {
      name: '中国第一台蒸汽机车"龙号"',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Chinese_Steam_Locomotive.jpg/600px-Chinese_Steam_Locomotive.jpg',
      description: '1881年中国自行设计制造的第一台蒸汽机车，标志着中国铁路工业的起步，具有重要的历史意义'
    },
    {
      name: '毛泽东专列车厢',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Vintage_Train_Carriage.jpg/600px-Vintage_Train_Carriage.jpg',
      description: '毛泽东同志生前乘坐的专列车厢，内部陈设保持原貌，见证了新中国领导人的工作生活，是革命历史的重要实物'
    },
    {
      name: '詹天佑设计的京张铁路沙盘',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Railway_Model.jpg/600px-Railway_Model.jpg',
      description: '展示中国铁路工程师詹天佑设计的京张铁路全貌，这是中国人自行设计建造的第一条铁路，体现了中国人的智慧和创造力'
    }
  ],
  workflows: [
    {
      id: 'treasure-discovery',
      name: '镇馆之宝探索',
      description: '围绕中国铁道博物馆三大镇馆之宝的亲子探索路线',
      ages: ['3-6', '7-12', '13-18'],
      tasks: [
        { id: 'gate-photo', role: 'parent', type: 'photo', title: '门口打卡', subtitle: '在中国铁道博物馆门口拍一张照片', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-1', role: 'child', type: 'photo', title: '镇馆之宝 1/3', subtitle: '找到「中国第一台蒸汽机车"龙号"」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Chinese_Steam_Locomotive.jpg/600px-Chinese_Steam_Locomotive.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-2', role: 'child', type: 'photo', title: '镇馆之宝 2/3', subtitle: '找到「毛泽东专列车厢」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Vintage_Train_Carriage.jpg/600px-Vintage_Train_Carriage.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-3', role: 'child', type: 'photo', title: '镇馆之宝 3/3', subtitle: '找到「詹天佑设计的京张铁路沙盘」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Railway_Model.jpg/600px-Railway_Model.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'victory-photo', role: 'parent', type: 'photo', title: '完成合影', subtitle: '和家长比心/拥抱/击掌，留下美好瞬间！', ages: ['3-6','7-12','13-18'] },
        { id: 'poster', role: 'parent', type: 'poster', title: '成就海报', subtitle: '生成专属成就海报', ages: ['3-6','7-12','13-18'] }
      ]
    }
  ],
  checklists: {
    parent: {
      '3-6': [
        '📸 门口打卡：家长给孩子在中国铁道博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「中国第一台蒸汽机车"龙号"」并合影',
        '🏺 镇馆之宝：找到「毛泽东专列车厢」并合影',
        '🏺 镇馆之宝：找到「詹天佑设计的京张铁路沙盘」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '7-12': [
        '📸 门口打卡：家长给孩子在中国铁道博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「中国第一台蒸汽机车"龙号"」并合影',
        '🏺 镇馆之宝：找到「毛泽东专列车厢」并合影',
        '🏺 镇馆之宝：找到「詹天佑设计的京张铁路沙盘」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '13-18': [
        '📸 门口打卡：家长给孩子在中国铁道博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「中国第一台蒸汽机车"龙号"」并合影',
        '🏺 镇馆之宝：找到「毛泽东专列车厢」并合影',
        '🏺 镇馆之宝：找到「詹天佑设计的京张铁路沙盘」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ]
    },
    child: {
      '3-6': [
        '📸 门口打卡：家长给孩子在中国铁道博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「中国第一台蒸汽机车"龙号"」并合影',
        '🏺 镇馆之宝：找到「毛泽东专列车厢」并合影',
        '🏺 镇馆之宝：找到「詹天佑设计的京张铁路沙盘」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '7-12': [
        '📸 门口打卡：家长给孩子在中国铁道博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「中国第一台蒸汽机车"龙号"」并合影',
        '🏺 镇馆之宝：找到「毛泽东专列车厢」并合影',
        '🏺 镇馆之宝：找到「詹天佑设计的京张铁路沙盘」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '13-18': [
        '📸 门口打卡：家长给孩子在中国铁道博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「中国第一台蒸汽机车"龙号"」并合影',
        '🏺 镇馆之宝：找到「毛泽东专列车厢」并合影',
        '🏺 镇馆之宝：找到「詹天佑设计的京张铁路沙盘」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ]
    }
  }
};
