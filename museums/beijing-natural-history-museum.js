window.MUSEUM_BEIJING_NATURAL_HISTORY = {
  id: 'beijing-natural-history-museum',
  name: '北京自然博物馆',
  location: '北京',
  description: '中国第一个自然科学博物馆，展示地球生物演化历程',
  tags: ['自然科学', '生物进化', '古生物'],
  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Natural_History_Museum_Beijing.jpg/500px-Natural_History_Museum_Beijing.jpg',
  collections: [
    {
      name: '马门溪龙化石',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Mamenchisaurus_skeleton.jpg/600px-Mamenchisaurus_skeleton.jpg',
      description: '侏罗纪时期的巨型恐龙化石，身长约22米，颈部长达11米，是目前已知颈部最长的恐龙之一，对研究恐龙演化具有重要意义'
    },
    {
      name: '黄河象化石骨架',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Mammoth_Skeleton.jpg/600px-Mammoth_Skeleton.jpg',
      description: '更新世时期的古象化石，保存完整，是研究古生物演化和古环境变迁的珍贵标本，展现了黄河流域的古生态环境'
    },
    {
      name: '北京人头盖骨复制品',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Peking_Man_Skull.jpg/400px-Peking_Man_Skull.jpg',
      description: '距今约70万年的北京猿人头盖骨复制品，原件发现于周口店，是人类演化研究的重要证据，对研究人类起源具有重要价值'
    }
  ],
  workflows: [
    {
      id: 'treasure-discovery',
      name: '镇馆之宝探索',
      description: '围绕北京自然博物馆三大镇馆之宝的亲子探索路线',
      ages: ['3-6', '7-12', '13-18'],
      tasks: [
        { id: 'gate-photo', role: 'parent', type: 'photo', title: '门口打卡', subtitle: '在北京自然博物馆门口拍一张照片', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-1', role: 'child', type: 'photo', title: '镇馆之宝 1/3', subtitle: '找到「马门溪龙化石」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Mamenchisaurus_skeleton.jpg/600px-Mamenchisaurus_skeleton.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-2', role: 'child', type: 'photo', title: '镇馆之宝 2/3', subtitle: '找到「黄河象化石骨架」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Mammoth_Skeleton.jpg/600px-Mammoth_Skeleton.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-3', role: 'child', type: 'photo', title: '镇馆之宝 3/3', subtitle: '找到「北京人头盖骨复制品」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Peking_Man_Skull.jpg/400px-Peking_Man_Skull.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'victory-photo', role: 'parent', type: 'photo', title: '完成合影', subtitle: '和家长比心/拥抱/击掌，留下美好瞬间！', ages: ['3-6','7-12','13-18'] },
        { id: 'poster', role: 'parent', type: 'poster', title: '成就海报', subtitle: '生成专属成就海报', ages: ['3-6','7-12','13-18'] }
      ]
    }
  ],
  checklists: {
    parent: {
      '3-6': [
        '📸 门口打卡：家长给孩子在北京自然博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「马门溪龙化石」并合影',
        '🏺 镇馆之宝：找到「黄河象化石骨架」并合影',
        '🏺 镇馆之宝：找到「北京人头盖骨复制品」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '7-12': [
        '📸 门口打卡：家长给孩子在北京自然博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「马门溪龙化石」并合影',
        '🏺 镇馆之宝：找到「黄河象化石骨架」并合影',
        '🏺 镇馆之宝：找到「北京人头盖骨复制品」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '13-18': [
        '📸 门口打卡：家长给孩子在北京自然博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「马门溪龙化石」并合影',
        '🏺 镇馆之宝：找到「黄河象化石骨架」并合影',
        '🏺 镇馆之宝：找到「北京人头盖骨复制品」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ]
    },
    child: {
      '3-6': [
        '📸 门口打卡：家长给孩子在北京自然博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「马门溪龙化石」并合影',
        '🏺 镇馆之宝：找到「黄河象化石骨架」并合影',
        '🏺 镇馆之宝：找到「北京人头盖骨复制品」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '7-12': [
        '📸 门口打卡：家长给孩子在北京自然博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「马门溪龙化石」并合影',
        '🏺 镇馆之宝：找到「黄河象化石骨架」并合影',
        '🏺 镇馆之宝：找到「北京人头盖骨复制品」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '13-18': [
        '📸 门口打卡：家长给孩子在北京自然博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「马门溪龙化石」并合影',
        '🏺 镇馆之宝：找到「黄河象化石骨架」并合影',
        '🏺 镇馆之宝：找到「北京人头盖骨复制品」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ]
    }
  }
};
