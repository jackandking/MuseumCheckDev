window.MUSEUM_CHINA_SCIENCE_TECH = {
  id: 'china-science-technology-museum',
  name: '中国科学技术馆',
  location: '北京',
  description: '国家级综合性科技馆，展示科学技术发展成就',
  tags: ['科学技术', '科普教育', '创新发展'],
  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/China_Science_Technology_Museum.jpg/500px-China_Science_Technology_Museum.jpg',
  collections: [
    {
      name: '东方红一号卫星',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Satellite_Model.jpg/600px-Satellite_Model.jpg',
      description: '1970年发射的中国第一颗人造地球卫星模型，标志着中国进入航天时代，是中国航天事业的里程碑'
    },
    {
      name: '神舟飞船返回舱',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Space_Capsule.jpg/600px-Space_Capsule.jpg',
      description: '神舟飞船返回舱实物，承载着中国航天员遨游太空的梦想，展示了中国载人航天技术的重大成就'
    },
    {
      name: '古代造纸术演示装置',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Papermaking_Demo.jpg/600px-Papermaking_Demo.jpg',
      description: '展示中国古代四大发明之一造纸术的工艺流程，让观众了解这项改变世界文明进程的伟大发明'
    }
  ],
  workflows: [
    {
      id: 'treasure-discovery',
      name: '镇馆之宝探索',
      description: '围绕中国科学技术馆三大镇馆之宝的亲子探索路线',
      ages: ['3-6', '7-12', '13-18'],
      tasks: [
        { id: 'gate-photo', role: 'parent', type: 'photo', title: '门口打卡', subtitle: '在中国科学技术馆门口拍一张照片', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-1', role: 'child', type: 'photo', title: '镇馆之宝 1/3', subtitle: '找到「东方红一号卫星」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Satellite_Model.jpg/600px-Satellite_Model.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-2', role: 'child', type: 'photo', title: '镇馆之宝 2/3', subtitle: '找到「神舟飞船返回舱」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Space_Capsule.jpg/600px-Space_Capsule.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-3', role: 'child', type: 'photo', title: '镇馆之宝 3/3', subtitle: '找到「古代造纸术演示装置」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Papermaking_Demo.jpg/600px-Papermaking_Demo.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'victory-photo', role: 'parent', type: 'photo', title: '完成合影', subtitle: '和家长比心/拥抱/击掌，留下美好瞬间！', ages: ['3-6','7-12','13-18'] },
        { id: 'poster', role: 'parent', type: 'poster', title: '成就海报', subtitle: '生成专属成就海报', ages: ['3-6','7-12','13-18'] }
      ]
    }
  ],
  checklists: {
    parent: {
      '3-6': [
        '📸 门口打卡：家长给孩子在中国科学技术馆门口拍一张照片',
        '🏺 镇馆之宝：找到「东方红一号卫星」并合影',
        '🏺 镇馆之宝：找到「神舟飞船返回舱」并合影',
        '🏺 镇馆之宝：找到「古代造纸术演示装置」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '7-12': [
        '📸 门口打卡：家长给孩子在中国科学技术馆门口拍一张照片',
        '🏺 镇馆之宝：找到「东方红一号卫星」并合影',
        '🏺 镇馆之宝：找到「神舟飞船返回舱」并合影',
        '🏺 镇馆之宝：找到「古代造纸术演示装置」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '13-18': [
        '📸 门口打卡：家长给孩子在中国科学技术馆门口拍一张照片',
        '🏺 镇馆之宝：找到「东方红一号卫星」并合影',
        '🏺 镇馆之宝：找到「神舟飞船返回舱」并合影',
        '🏺 镇馆之宝：找到「古代造纸术演示装置」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ]
    },
    child: {
      '3-6': [
        '📸 门口打卡：家长给孩子在中国科学技术馆门口拍一张照片',
        '🏺 镇馆之宝：找到「东方红一号卫星」并合影',
        '🏺 镇馆之宝：找到「神舟飞船返回舱」并合影',
        '🏺 镇馆之宝：找到「古代造纸术演示装置」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '7-12': [
        '📸 门口打卡：家长给孩子在中国科学技术馆门口拍一张照片',
        '🏺 镇馆之宝：找到「东方红一号卫星」并合影',
        '🏺 镇馆之宝：找到「神舟飞船返回舱」并合影',
        '🏺 镇馆之宝：找到「古代造纸术演示装置」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '13-18': [
        '📸 门口打卡：家长给孩子在中国科学技术馆门口拍一张照片',
        '🏺 镇馆之宝：找到「东方红一号卫星」并合影',
        '🏺 镇馆之宝：找到「神舟飞船返回舱」并合影',
        '🏺 镇馆之宝：找到「古代造纸术演示装置」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ]
    }
  }
};
