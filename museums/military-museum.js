window.MUSEUM_MILITARY = {
  id: 'china-military-museum',
  name: '中国人民革命军事博物馆',
  location: '北京',
  description: '展示中国军事历史和人民军队发展历程的专业博物馆',
  tags: ['军事历史', '革命历史', '国防教育'],
  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Military_Museum_Beijing.jpg/500px-Military_Museum_Beijing.jpg',
  collections: [
    {
      name: '开国大典使用的礼炮',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Chinese_Artillery.jpg/600px-Chinese_Artillery.jpg',
      description: '1949年10月1日开国大典上鸣放的54门礼炮之一，见证了新中国的诞生，具有重要的历史意义和纪念价值'
    },
    {
      name: '红军长征时期使用的电台',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Vintage_Radio_Equipment.jpg/400px-Vintage_Radio_Equipment.jpg',
      description: '红军长征期间使用的通信设备，在极其艰苦的条件下保持了党中央与各部队的联系，是中国革命史的重要见证'
    },
    {
      name: '抗美援朝战争志愿军战旗',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Chinese_Military_Flag.jpg/600px-Chinese_Military_Flag.jpg',
      description: '中国人民志愿军在抗美援朝战争中使用的军旗，记录了志愿军英勇作战的光荣历史，是爱国主义教育的重要教材'
    }
  ],
  workflows: [
    {
      id: 'treasure-discovery',
      name: '镇馆之宝探索',
      description: '围绕中国人民革命军事博物馆三大镇馆之宝的亲子探索路线',
      ages: ['3-6', '7-12', '13-18'],
      tasks: [
        { id: 'gate-photo', role: 'parent', type: 'photo', title: '门口打卡', subtitle: '在中国人民革命军事博物馆门口拍一张照片', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-1', role: 'child', type: 'photo', title: '镇馆之宝 1/3', subtitle: '找到「开国大典使用的礼炮」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Chinese_Artillery.jpg/600px-Chinese_Artillery.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-2', role: 'child', type: 'photo', title: '镇馆之宝 2/3', subtitle: '找到「红军长征时期使用的电台」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Vintage_Radio_Equipment.jpg/400px-Vintage_Radio_Equipment.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-3', role: 'child', type: 'photo', title: '镇馆之宝 3/3', subtitle: '找到「抗美援朝战争志愿军战旗」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Chinese_Military_Flag.jpg/600px-Chinese_Military_Flag.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'victory-photo', role: 'parent', type: 'photo', title: '完成合影', subtitle: '和家长比心/拥抱/击掌，留下美好瞬间！', ages: ['3-6','7-12','13-18'] },
        { id: 'poster', role: 'parent', type: 'poster', title: '成就海报', subtitle: '生成专属成就海报', ages: ['3-6','7-12','13-18'] }
      ]
    }
  ],
  checklists: {
    parent: {
      '3-6': [
        '📸 门口打卡：家长给孩子在中国人民革命军事博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「开国大典使用的礼炮」并合影',
        '🏺 镇馆之宝：找到「红军长征时期使用的电台」并合影',
        '🏺 镇馆之宝：找到「抗美援朝战争志愿军战旗」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '7-12': [
        '📸 门口打卡：家长给孩子在中国人民革命军事博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「开国大典使用的礼炮」并合影',
        '🏺 镇馆之宝：找到「红军长征时期使用的电台」并合影',
        '🏺 镇馆之宝：找到「抗美援朝战争志愿军战旗」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '13-18': [
        '📸 门口打卡：家长给孩子在中国人民革命军事博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「开国大典使用的礼炮」并合影',
        '🏺 镇馆之宝：找到「红军长征时期使用的电台」并合影',
        '🏺 镇馆之宝：找到「抗美援朝战争志愿军战旗」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ]
    },
    child: {
      '3-6': [
        '📸 门口打卡：家长给孩子在中国人民革命军事博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「开国大典使用的礼炮」并合影',
        '🏺 镇馆之宝：找到「红军长征时期使用的电台」并合影',
        '🏺 镇馆之宝：找到「抗美援朝战争志愿军战旗」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '7-12': [
        '📸 门口打卡：家长给孩子在中国人民革命军事博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「开国大典使用的礼炮」并合影',
        '🏺 镇馆之宝：找到「红军长征时期使用的电台」并合影',
        '🏺 镇馆之宝：找到「抗美援朝战争志愿军战旗」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '13-18': [
        '📸 门口打卡：家长给孩子在中国人民革命军事博物馆门口拍一张照片',
        '🏺 镇馆之宝：找到「开国大典使用的礼炮」并合影',
        '🏺 镇馆之宝：找到「红军长征时期使用的电台」并合影',
        '🏺 镇馆之宝：找到「抗美援朝战争志愿军战旗」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ]
    }
  }
};
