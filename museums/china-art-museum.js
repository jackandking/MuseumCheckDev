window.MUSEUM_CHINA_ART = {
  id: 'china-art-museum',
  name: '中国美术馆',
  location: '北京',
  description: '国家造型艺术博物馆，收藏展示中国现当代美术作品',
  tags: ['美术', '艺术', '绘画'],
  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/National_Art_Museum_of_China.jpg/500px-National_Art_Museum_of_China.jpg',
  collections: [
    {
      name: '徐悲鸿《奔马图》',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Xu_Beihong_horse.jpg/500px-Xu_Beihong_horse.jpg',
      description: '徐悲鸿最具代表性的作品，以中国传统水墨技法描绘奔腾的骏马，笔墨酣畅，富有动感，展现了中国现代美术的创新精神'
    },
    {
      name: '齐白石《虾》系列',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Qi_Baishi_Shrimps.jpg/400px-Qi_Baishi_Shrimps.jpg',
      description: '齐白石晚年巅峰之作，以极简的笔墨表现虾的形态和质感，寥寥数笔，栩栩如生，是中国写意画的经典代表'
    },
    {
      name: '吴冠中《长江万里图》',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Wu_Guanzhong_Yangzi_River.jpg/600px-Wu_Guanzhong_Yangzi_River.jpg',
      description: '吴冠中1973年创作的油画长卷，全长503厘米，描绘了长江从青藏高原到入海口的壮丽景色，融合中西绘画技法，气势磅礴'
    }
  ],
  workflows: [
    {
      id: 'treasure-discovery',
      name: '镇馆之宝探索',
      description: '围绕中国美术馆三大镇馆之宝的亲子探索路线',
      ages: ['3-6', '7-12', '13-18'],
      tasks: [
        { id: 'gate-photo', role: 'parent', type: 'photo', title: '门口打卡', subtitle: '在中国美术馆门口拍一张照片', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-1', role: 'child', type: 'photo', title: '镇馆之宝 1/3', subtitle: '找到「徐悲鸿《奔马图》」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Xu_Beihong_horse.jpg/500px-Xu_Beihong_horse.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-2', role: 'child', type: 'photo', title: '镇馆之宝 2/3', subtitle: '找到「齐白石《虾》系列」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Qi_Baishi_Shrimps.jpg/400px-Qi_Baishi_Shrimps.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-3', role: 'child', type: 'photo', title: '镇馆之宝 3/3', subtitle: '找到「吴冠中《长江万里图》」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Wu_Guanzhong_Yangzi_River.jpg/600px-Wu_Guanzhong_Yangzi_River.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'victory-photo', role: 'parent', type: 'photo', title: '完成合影', subtitle: '和家长比心/拥抱/击掌，留下美好瞬间！', ages: ['3-6','7-12','13-18'] },
        { id: 'poster', role: 'parent', type: 'poster', title: '成就海报', subtitle: '生成专属成就海报', ages: ['3-6','7-12','13-18'] }
      ]
    }
  ],
  checklists: {
    parent: {
      '3-6': [
        '🎨 入馆指南：免费参观需预约，推荐上午时段参观，人少光线好，儿童推车可借用',
        '👶 幼儿艺术路线：一楼中国画展厅(山水花鸟) → 二楼油画展厅(色彩丰富) → 雕塑园(立体感受)',
        '🖍️ 艺术探索包：准备彩色铅笔、素描本、橡皮擦、小凳子，让孩子随时记录美好',
        '🌈 美学启蒙语言：中国画是"用毛笔画的诗"，油画是"用颜料讲的故事"，雕塑是"立体的画"',
        '⏰ 艺术时光：每个展厅15分钟，中间在休息区讲画中故事，总时长1小时避免审美疲劳',
        '💕 美的分享：当孩子指着画说"真漂亮"时，蹲下来拥抱说"你有一双发现美的眼睛！"',
        '📸 艺术记忆：孩子模仿雕塑姿势拍照 + 最喜欢画作前合影 + 创作过程留念',
        '🎁 创作延续：参观后到文创店选购艺术材料，回家创作"我眼中的美术馆"',
        '🌟 美好时刻：和孩子一起回忆"今天看到最美的颜色"，创造温馨的艺术启蒙时光'
      ],
      '7-12': [
        '📱 专业导览：下载"中国美术馆"APP → 选择"青少年导览" → 重点关注现当代名家作品',
        '🖼️ 美术史基础：中国传统绘画(山水人物花鸟) → 近现代美术(融合中西) → 当代艺术创新',
        '🎨 绘画技法认知：工笔vs写意、素描vs色彩、国画颜料vs油画颜料的不同特色',
        '👨‍🎨 艺术家故事：了解徐悲鸿、齐白石、张大千等大师的创作故事和艺术风格',
        '🏛️ 展览策展逻辑：理解美术馆"按时代、流派、主题"的展陈方式，培养艺术思维',
        '💫 艺术对话：鼓励孩子表达对作品的感受，然后一起探讨"艺术家想要表达什么情感"',
        '✏️ 创作体验：在指定区域临摹简单作品，或创作主题画作"我心中的美术馆"',
        '🔍 细节观察训练：学会观察画作的色彩、线条、构图，培养艺术鉴赏能力',
        '🎊 艺术成就庆祝：和孩子一起完成"小艺术家证书"，庆祝今天的美学成长之旅'
      ],
      '13-18': [
        '🎓 美术史深度研习：深入了解20世纪中国美术发展脉络，掌握重要艺术运动和代表人物',
        '🏛️ 美术馆学理论：理解中国美术馆"弘扬民族艺术，展示时代精神"的收藏展示理念',
        '🔍 艺术批评方法：学会从技法、内容、风格、文化背景多角度分析艺术作品',
        '🌏 中外艺术对比：比较中西方艺术发展差异，思考全球化时代的中国艺术定位',
        '💡 创作技法研究：深入了解不同绘画材料和技法，思考技法如何服务于艺术表达',
        '💎 艺术哲思：和青少年平等探讨"什么是美"、"艺术的社会价值"等美学哲学问题',
        '🎯 专题深度研究：选择感兴趣的艺术家或流派进行深度研究，培养学术研究能力',
        '📝 艺术评论写作：撰写专业艺术评论文章，提升艺术鉴赏和文字表达能力',
        '🌟 美学智慧共享：邀请青少年分享艺术感悟，一起探讨艺术对人生成长的意义'
      ]
    },
    child: {
      '3-6': [
        '📸 门口打卡：家长给孩子在中国美术馆门口拍一张照片',
        '🖼️ 镇馆之宝：找到「徐悲鸿《奔马图》」并合影',
        '🦐 镇馆之宝：找到「齐白石《虾》系列」并合影',
        '🏞️ 镇馆之宝：找到「吴冠中《长江万里图》」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '7-12': [
        '📸 门口打卡：家长给孩子在中国美术馆门口拍一张照片',
        '🖼️ 镇馆之宝：找到「徐悲鸿《奔马图》」并合影',
        '🦐 镇馆之宝：找到「齐白石《虾》系列」并合影',
        '🏞️ 镇馆之宝：找到「吴冠中《长江万里图》」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '13-18': [
        '📸 门口打卡：家长给孩子在中国美术馆门口拍一张照片',
        '🖼️ 镇馆之宝：找到「徐悲鸿《奔马图》」并合影',
        '🦐 镇馆之宝：找到「齐白石《虾》系列」并合影',
        '🏞️ 镇馆之宝：找到「吴冠中《长江万里图》」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ]
    }
  }
};
