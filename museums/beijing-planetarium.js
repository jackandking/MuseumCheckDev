window.MUSEUM_BEIJING_PLANETARIUM = {
  id: 'beijing-planetarium',
  name: '北京天文馆',
  location: '北京',
  description: '中国第一座大型天文馆，展示天文科学知识',
  tags: ['天文学', '科学教育', '宇宙探索'],
  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Beijing_Planetarium.jpg/500px-Beijing_Planetarium.jpg',
  collections: [
    {
      name: '明代简仪',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Ancient_Astronomical_Instrument.jpg/600px-Ancient_Astronomical_Instrument.jpg',
      description: '明代天文观测仪器，用于测量天体位置，体现了中国古代天文学的高度发展，是研究古代天文学的重要实物'
    },
    {
      name: '月岩样本',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Moon_Rock_Sample.jpg/400px-Moon_Rock_Sample.jpg',
      description: '珍贵的月球岩石样本，让观众近距离接触来自月球的物质，了解月球的地质构成和形成历史'
    },
    {
      name: '中国古代星图',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Ancient_Star_Map.jpg/600px-Ancient_Star_Map.jpg',
      description: '中国古代绘制的星空图，记录了数千年前人们对宇宙的认识，展示了中国古代天文学的辉煌成就'
    }
  ],
  workflows: [
    {
      id: 'treasure-discovery',
      name: '镇馆之宝探索',
      description: '围绕北京天文馆三大镇馆之宝的亲子探索路线',
      ages: ['3-6', '7-12', '13-18'],
      tasks: [
        { id: 'gate-photo', role: 'parent', type: 'photo', title: '门口打卡', subtitle: '在北京天文馆门口拍一张照片', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-1', role: 'child', type: 'photo', title: '镇馆之宝 1/3', subtitle: '找到「明代简仪」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Ancient_Astronomical_Instrument.jpg/600px-Ancient_Astronomical_Instrument.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-2', role: 'child', type: 'photo', title: '镇馆之宝 2/3', subtitle: '找到「月岩样本」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Moon_Rock_Sample.jpg/400px-Moon_Rock_Sample.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-3', role: 'child', type: 'photo', title: '镇馆之宝 3/3', subtitle: '找到「中国古代星图」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Ancient_Star_Map.jpg/600px-Ancient_Star_Map.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'victory-photo', role: 'parent', type: 'photo', title: '完成合影', subtitle: '和家长比心/拥抱/击掌，留下美好瞬间！', ages: ['3-6','7-12','13-18'] },
        { id: 'poster', role: 'parent', type: 'poster', title: '成就海报', subtitle: '生成专属成就海报', ages: ['3-6','7-12','13-18'] }
      ]
    }
  ],
  checklists: {
    parent: {
      '3-6': [
        '📸 门口打卡：家长给孩子在北京天文馆门口拍一张照片',
        '🏺 镇馆之宝：找到「明代简仪」并合影',
        '🏺 镇馆之宝：找到「月岩样本」并合影',
        '🏺 镇馆之宝：找到「中国古代星图」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '7-12': [
        '📸 门口打卡：家长给孩子在北京天文馆门口拍一张照片',
        '🏺 镇馆之宝：找到「明代简仪」并合影',
        '🏺 镇馆之宝：找到「月岩样本」并合影',
        '🏺 镇馆之宝：找到「中国古代星图」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '13-18': [
        '📸 门口打卡：家长给孩子在北京天文馆门口拍一张照片',
        '🏺 镇馆之宝：找到「明代简仪」并合影',
        '🏺 镇馆之宝：找到「月岩样本」并合影',
        '🏺 镇馆之宝：找到「中国古代星图」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ]
    },
    child: {
      '3-6': [
        '📸 门口打卡：家长给孩子在北京天文馆门口拍一张照片',
        '🏺 镇馆之宝：找到「明代简仪」并合影',
        '🏺 镇馆之宝：找到「月岩样本」并合影',
        '🏺 镇馆之宝：找到「中国古代星图」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '7-12': [
        '📸 门口打卡：家长给孩子在北京天文馆门口拍一张照片',
        '🏺 镇馆之宝：找到「明代简仪」并合影',
        '🏺 镇馆之宝：找到「月岩样本」并合影',
        '🏺 镇馆之宝：找到「中国古代星图」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '13-18': [
        '📸 门口打卡：家长给孩子在北京天文馆门口拍一张照片',
        '🏺 镇馆之宝：找到「明代简仪」并合影',
        '🏺 镇馆之宝：找到「月岩样本」并合影',
        '🏺 镇馆之宝：找到「中国古代星图」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ]
    }
  }
};
