(function(){
  'use strict';
  // Workflow registry: keyed by museum id
  // Each workflow has id, name, description, and a flat array of tasks
  // Task fields: id, role: 'parent'|'child', type: 'photo'|'confirm'|'tts'|'link'|'poster', title, subtitle, tts, url
  const WORKFLOWS = {
    'forbidden-city': [
      {
        id: 'easy-family-tour',
        name: '亲子轻松游',
        description: '轻量三步走，拍照留念+简单任务，适合首次到访',
        ages: ['3-6','7-12'],
        tasks: [
          { id: 'gate-photo', role: 'parent', type: 'photo', title: '门口打卡', subtitle: '午门前合影', ages: ['3-6','7-12','13-18'] },
          { id: 'find-dragon', role: 'child', type: 'confirm', title: '寻找神兽', subtitle: '屋檐上找到一只龙或凤凰', ages: ['3-6','7-12'] },
          { id: 'count-roof-animals', role: 'child', type: 'confirm', title: '数数瑞兽', subtitle: '数一数屋檐走兽有几只（可以和家长一起数）', ages: ['3-6','7-12'] },
          { id: 'door-nails', role: 'child', type: 'confirm', title: '门钉小秘密', subtitle: '观察一扇大门，试着数一列门钉有几个', ages: ['7-12','13-18'] },
          { id: 'victory-photo', role: 'parent', type: 'photo', title: '胜利合影', subtitle: '御花园合影', ages: ['3-6','7-12','13-18'] },
          { id: 'poster', role: 'parent', type: 'poster', title: '成就海报', subtitle: '生成专属成就海报', ages: ['3-6','7-12','13-18'] }
        ]
      },
      {
        id: 'curation-deep',
        name: '三大殿精华',
        description: '围绕太和殿-中和殿-保和殿的精华路线',
        ages: ['7-12','13-18'],
        tasks: [
          { id: 'taihe-photo', role: 'parent', type: 'photo', title: '太和殿', subtitle: '门前合影', ages: ['7-12','13-18'] },
          { id: 'throne-confirm', role: 'child', type: 'confirm', title: '龙椅观察', subtitle: '说出龙椅上看到的两处细节', ages: ['7-12','13-18'] },
          { id: 'zhonghe-ritual', role: 'child', type: 'confirm', title: '中和殿用途', subtitle: '中和殿在典礼流程中起到什么作用？用一句话描述', ages: ['13-18'] },
          { id: 'baohe-photo', role: 'parent', type: 'photo', title: '保和殿', subtitle: '台阶留影', ages: ['7-12','13-18'] },
          { id: 'poster', role: 'parent', type: 'poster', title: '成就海报', subtitle: '生成专属成就海报', ages: ['3-6','7-12','13-18'] }
        ]
      },
    ],
    'national-museum': [
      {
        id: 'family-starter',
        name: '首访精华·亲子版',
        description: '轻量路线，涵盖镇馆基础展的入门体验',
        ages: ['3-6','7-12'],
        tasks: [
          { id: 'gate-photo', role: 'parent', type: 'photo', title: '门口打卡', subtitle: '国博主入口合影', ages: ['3-6','7-12','13-18'] },
          { id: 'find-animal', role: 'child', type: 'confirm', title: '寻找动物纹', subtitle: '在青铜器上找一种动物纹饰并描述', ages: ['7-12','13-18'] },
          { id: 'victory', role: 'parent', type: 'photo', title: '胜利合影', subtitle: '大厅留影', ages: ['3-6','7-12','13-18'] },
          { id: 'poster', role: 'parent', type: 'poster', title: '成就海报', subtitle: '生成专属成就海报', ages: ['3-6','7-12','13-18'] }
        ]
      }
    ],
    'shanghai-museum': [
      {
        id: 'bronze-porcelain-lite',
        name: '青铜与陶瓷轻享',
        description: '以打卡+观察为主的亲子路线',
        ages: ['7-12','13-18'],
        tasks: [
          { id: 'bronze-photo', role: 'parent', type: 'photo', title: '青铜厅到此一游', subtitle: '入口处合影', ages: ['7-12','13-18'] },
          { id: 'shape-observe', role: 'child', type: 'confirm', title: '器形观察', subtitle: '说出一件器物的名称与用途', ages: ['7-12','13-18'] },
          { id: 'porcelain-photo', role: 'parent', type: 'photo', title: '陶瓷厅打卡', subtitle: '挑一件最喜欢的瓷器合影', ages: ['7-12','13-18'] },
          { id: 'poster', role: 'parent', type: 'poster', title: '成就海报', subtitle: '生成专属成就海报', ages: ['3-6','7-12','13-18'] }
        ]
      }
    ],
    'shanghai-science-technology-museum': [
      {
        id: 'hands-on-fun',
        name: '动手玩科学',
        description: '以互动展项为主，低龄友好',
        ages: ['3-6','7-12'],
        tasks: [
          { id: 'entrance', role: 'parent', type: 'photo', title: '门口打卡', subtitle: '入口处合影', ages: ['3-6','7-12'] },
          { id: 'interactive', role: 'child', type: 'confirm', title: '完成一个互动装置', subtitle: '描述你做了什么现象', ages: ['3-6','7-12'] },
          { id: 'finish', role: 'parent', type: 'photo', title: '胜利合影', subtitle: '把今天的笑脸记录下来', ages: ['3-6','7-12','13-18'] },
          { id: 'poster', role: 'parent', type: 'poster', title: '成就海报', subtitle: '生成专属成就海报', ages: ['3-6','7-12','13-18'] }
        ]
      }
    ],
    'china-art-museum': [
      {
            "id": "treasure-discovery",
            "name": "镇馆之宝探索",
            "description": "围绕中国美术馆的三大镇馆之宝的亲子探索路线",
            "ages": [
                  "3-6",
                  "7-12",
                  "13-18"
            ],
            "tasks": [
                  {
                        "id": "entrance-photo",
                        "role": "parent",
                        "type": "photo",
                        "title": "门口打卡",
                        "subtitle": "在中国美术馆门口拍一张照片",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-1",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 1/3",
                        "subtitle": "找到第1件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-2",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 2/3",
                        "subtitle": "找到第2件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-3",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 3/3",
                        "subtitle": "找到第3件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "victory-photo",
                        "role": "parent",
                        "type": "photo",
                        "title": "完成合影",
                        "subtitle": "和家长比心/拥抱/击掌，留下美好瞬间！",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "poster",
                        "role": "parent",
                        "type": "poster",
                        "title": "成就海报",
                        "subtitle": "生成专属成就海报",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  }
            ]
      }
    ],
    'beijing-capital-museum': [
      {
            "id": "treasure-discovery",
            "name": "镇馆之宝探索",
            "description": "围绕首都博物馆的三大镇馆之宝的亲子探索路线",
            "ages": [
                  "3-6",
                  "7-12",
                  "13-18"
            ],
            "tasks": [
                  {
                        "id": "entrance-photo",
                        "role": "parent",
                        "type": "photo",
                        "title": "门口打卡",
                        "subtitle": "在首都博物馆门口拍一张照片",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-1",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 1/3",
                        "subtitle": "找到第1件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-2",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 2/3",
                        "subtitle": "找到第2件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-3",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 3/3",
                        "subtitle": "找到第3件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "victory-photo",
                        "role": "parent",
                        "type": "photo",
                        "title": "完成合影",
                        "subtitle": "和家长比心/拥抱/击掌，留下美好瞬间！",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "poster",
                        "role": "parent",
                        "type": "poster",
                        "title": "成就海报",
                        "subtitle": "生成专属成就海报",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  }
            ]
      }
    ],
    'china-military-museum': [
      {
            "id": "treasure-discovery",
            "name": "镇馆之宝探索",
            "description": "围绕中国人民革命军事博物馆的三大镇馆之宝的亲子探索路线",
            "ages": [
                  "3-6",
                  "7-12",
                  "13-18"
            ],
            "tasks": [
                  {
                        "id": "entrance-photo",
                        "role": "parent",
                        "type": "photo",
                        "title": "门口打卡",
                        "subtitle": "在中国人民革命军事博物馆门口拍一张照片",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-1",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 1/3",
                        "subtitle": "找到第1件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-2",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 2/3",
                        "subtitle": "找到第2件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-3",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 3/3",
                        "subtitle": "找到第3件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "victory-photo",
                        "role": "parent",
                        "type": "photo",
                        "title": "完成合影",
                        "subtitle": "和家长比心/拥抱/击掌，留下美好瞬间！",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "poster",
                        "role": "parent",
                        "type": "poster",
                        "title": "成就海报",
                        "subtitle": "生成专属成就海报",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  }
            ]
      }
    ],
    'beijing-natural-history-museum': [
      {
            "id": "treasure-discovery",
            "name": "镇馆之宝探索",
            "description": "围绕北京自然博物馆的三大镇馆之宝的亲子探索路线",
            "ages": [
                  "3-6",
                  "7-12",
                  "13-18"
            ],
            "tasks": [
                  {
                        "id": "entrance-photo",
                        "role": "parent",
                        "type": "photo",
                        "title": "门口打卡",
                        "subtitle": "在北京自然博物馆门口拍一张照片",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-1",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 1/3",
                        "subtitle": "找到第1件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-2",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 2/3",
                        "subtitle": "找到第2件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-3",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 3/3",
                        "subtitle": "找到第3件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "victory-photo",
                        "role": "parent",
                        "type": "photo",
                        "title": "完成合影",
                        "subtitle": "和家长比心/拥抱/击掌，留下美好瞬间！",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "poster",
                        "role": "parent",
                        "type": "poster",
                        "title": "成就海报",
                        "subtitle": "生成专属成就海报",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  }
            ]
      }
    ],
    'china-railway-museum': [
      {
            "id": "treasure-discovery",
            "name": "镇馆之宝探索",
            "description": "围绕中国铁道博物馆的三大镇馆之宝的亲子探索路线",
            "ages": [
                  "3-6",
                  "7-12",
                  "13-18"
            ],
            "tasks": [
                  {
                        "id": "entrance-photo",
                        "role": "parent",
                        "type": "photo",
                        "title": "门口打卡",
                        "subtitle": "在中国铁道博物馆门口拍一张照片",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-1",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 1/3",
                        "subtitle": "找到第1件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-2",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 2/3",
                        "subtitle": "找到第2件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-3",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 3/3",
                        "subtitle": "找到第3件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "victory-photo",
                        "role": "parent",
                        "type": "photo",
                        "title": "完成合影",
                        "subtitle": "和家长比心/拥抱/击掌，留下美好瞬间！",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "poster",
                        "role": "parent",
                        "type": "poster",
                        "title": "成就海报",
                        "subtitle": "生成专属成就海报",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  }
            ]
      }
    ],
    'beijing-planetarium': [
      {
            "id": "treasure-discovery",
            "name": "镇馆之宝探索",
            "description": "围绕北京天文馆的三大镇馆之宝的亲子探索路线",
            "ages": [
                  "3-6",
                  "7-12",
                  "13-18"
            ],
            "tasks": [
                  {
                        "id": "entrance-photo",
                        "role": "parent",
                        "type": "photo",
                        "title": "门口打卡",
                        "subtitle": "在北京天文馆门口拍一张照片",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-1",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 1/3",
                        "subtitle": "找到第1件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-2",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 2/3",
                        "subtitle": "找到第2件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-3",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 3/3",
                        "subtitle": "找到第3件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "victory-photo",
                        "role": "parent",
                        "type": "photo",
                        "title": "完成合影",
                        "subtitle": "和家长比心/拥抱/击掌，留下美好瞬间！",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "poster",
                        "role": "parent",
                        "type": "poster",
                        "title": "成就海报",
                        "subtitle": "生成专属成就海报",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  }
            ]
      }
    ],
    'beijing-art-museum': [
      {
            "id": "treasure-discovery",
            "name": "镇馆之宝探索",
            "description": "围绕北京艺术博物馆的三大镇馆之宝的亲子探索路线",
            "ages": [
                  "3-6",
                  "7-12",
                  "13-18"
            ],
            "tasks": [
                  {
                        "id": "entrance-photo",
                        "role": "parent",
                        "type": "photo",
                        "title": "门口打卡",
                        "subtitle": "在北京艺术博物馆门口拍一张照片",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-1",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 1/3",
                        "subtitle": "找到第1件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-2",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 2/3",
                        "subtitle": "找到第2件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-3",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 3/3",
                        "subtitle": "找到第3件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "victory-photo",
                        "role": "parent",
                        "type": "photo",
                        "title": "完成合影",
                        "subtitle": "和家长比心/拥抱/击掌，留下美好瞬间！",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "poster",
                        "role": "parent",
                        "type": "poster",
                        "title": "成就海报",
                        "subtitle": "生成专属成就海报",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  }
            ]
      }
    ],
    'china-science-technology-museum': [
      {
            "id": "treasure-discovery",
            "name": "镇馆之宝探索",
            "description": "围绕中国科学技术馆的三大镇馆之宝的亲子探索路线",
            "ages": [
                  "3-6",
                  "7-12",
                  "13-18"
            ],
            "tasks": [
                  {
                        "id": "entrance-photo",
                        "role": "parent",
                        "type": "photo",
                        "title": "门口打卡",
                        "subtitle": "在中国科学技术馆门口拍一张照片",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-1",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 1/3",
                        "subtitle": "找到第1件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-2",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 2/3",
                        "subtitle": "找到第2件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "find-treasure-3",
                        "role": "child",
                        "type": "photo",
                        "title": "镇馆之宝 3/3",
                        "subtitle": "找到第3件镇馆之宝并合影",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "victory-photo",
                        "role": "parent",
                        "type": "photo",
                        "title": "完成合影",
                        "subtitle": "和家长比心/拥抱/击掌，留下美好瞬间！",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  },
                  {
                        "id": "poster",
                        "role": "parent",
                        "type": "poster",
                        "title": "成就海报",
                        "subtitle": "生成专属成就海报",
                        "ages": [
                              "3-6",
                              "7-12",
                              "13-18"
                        ]
                  }
            ]
      }
    ],
  };
  window.WORKFLOWS = WORKFLOWS;
})();
