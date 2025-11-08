window.MUSEUM_NATIONAL = {
  id: 'national-museum',
  name: '中国国家博物馆',
  location: '北京',
  description: '综合性历史艺术博物馆，展示中华民族悠久文化历史',
  tags: ['历史', '文化', '艺术'],
  image: 'https://eb118-file.cdn.bcebos.com/upload/5b6fdbca17a04047b55adc6658a750bd_2211489532.png?x-bce-process=image/format,f_auto/resize,m_lfit,limit_1,w_500,h_500/quality,q_85',
  collections: [
    {
      name: '四羊方尊',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Simuwu_ding.jpg/600px-Simuwu_ding.jpg',
      description: '商代晚期青铜礼器，高58.3厘米，重34.5公斤。器身四角各有一只卷角山羊，造型精美，是商朝青铜器铸造工艺的巅峰之作，体现了中国古代青铜文明的高度发达'
    },
    {
      name: '后母戊鼎',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Houmuwu_Ding.jpg/600px-Houmuwu_Ding.jpg',
      description: '商代后期青铜器，高133厘米，重832.84公斤，是世界上现存最大最重的青铜器。鼎内壁铸有"后母戊"三字，是商王为祭祀母亲而铸造，展现了商代高超的青铜铸造技术'
    },
    {
      name: '人面鱼纹彩陶盆',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Painted_pottery_basin_with_human_face_and_fish_design.jpg/600px-Painted_pottery_basin_with_human_face_and_fish_design.jpg',
      description: '新石器时代仰韶文化彩陶，距今约6000年。盆内壁绘有人面和鱼纹图案，是原始艺术的代表作，体现了史前人类的审美观念和宗教信仰'
    }
  ],
  workflows: [
    {
      id: 'treasure-discovery',
      name: '镇馆之宝探索',
      description: '围绕中国国家博物馆三大镇馆之宝的亲子探索路线',
      ages: ['3-6', '7-12', '13-18'],
      tasks: [
        { id: 'gate-photo', role: 'parent', type: 'photo', title: '门口打卡', subtitle: '在中国国家博物馆门口拍一张照片', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-1', role: 'child', type: 'photo', title: '镇馆之宝 1/3', subtitle: '找到「四羊方尊」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Simuwu_ding.jpg/600px-Simuwu_ding.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-2', role: 'child', type: 'photo', title: '镇馆之宝 2/3', subtitle: '找到「后母戊鼎」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Houmuwu_Ding.jpg/600px-Houmuwu_Ding.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'find-treasure-3', role: 'child', type: 'photo', title: '镇馆之宝 3/3', subtitle: '找到「人面鱼纹彩陶盆」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Painted_pottery_basin_with_human_face_and_fish_design.jpg/600px-Painted_pottery_basin_with_human_face_and_fish_design.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'victory-photo', role: 'parent', type: 'photo', title: '完成合影', subtitle: '和家长比心/拥抱/击掌，留下美好瞬间！', ages: ['3-6','7-12','13-18'] },
        { id: 'poster', role: 'parent', type: 'poster', title: '成就海报', subtitle: '生成专属成就海报', ages: ['3-6','7-12','13-18'] }
      ]
    }
  ],
  checklists: {
    parent: {
      '3-6': [
        '🎫 入馆攻略：免费参观需身份证，官方微信预约 → 选择"古代中国"基本陈列 → 上午时段人少',
        '👶 幼儿专线：地下一层"古代中国"→ 一层"复兴之路"→ 避开复杂的临时展厅',
        '🧸 互动装备：准备小画册让孩子画感兴趣的文物 + 贴纸奖励 + 儿童放大镜观察细节',
        '🏺 镇馆之宝介绍：四羊方尊是3000年前的"礼品盒"，上面有4只小羊；后母戊鼎是古代最大的"锅"，可以煮一头牛；人面鱼纹彩陶盆上有笑脸和小鱼',
        '⏰ 时间规划：参观1.5小时为宜，中途在咖啡厅休息，避免疲劳哭闹',
        '💕 温馨互动：每次孩子指着文物说"这个是什么"时，先夸奖"你问得真好"，再温柔解答',
        '📸 打卡清单：四羊方尊前合影 + 恐龙化石旁拍照 + 古代铜车马模型体验',
        '🎁 延伸活动：参观后到文创店买古代文物拼图，回家继续"考古游戏"',
        '🎈 分享时光：回家路上问孩子"今天最开心的时候是什么"，认真倾听并给予回应'
      ],
      '7-12': [
        '📱 智慧导览：下载"国博"APP → 选择"中华文明探索"儿童路线 → 提前下载语音讲解',
        '📅 历史时间轴：准备中国朝代顺序表：夏商周秦汉，魏晋南北朝，隋唐五代宋元明清',
        '��️ 镇馆之宝详解：四羊方尊重34.5公斤，肩部有4只卷角山羊，是商朝青铜器巅峰之作；后母戊鼎重832.84公斤，是世界最重的古代青铜器；人面鱼纹彩陶盆距今6000年，是仰韶文化的代表',
        '🔍 文物解码：青铜器看铭文了解古文字，陶瓷看釉色判断朝代，玉器看工艺水平',
        '📚 课本链接：找到课文中学过的文物实物，如司母戊鼎、兵马俑、丝绸之路文物',
        '💫 鼓励探索：当孩子提出好奇的问题时，一起寻找答案，让他们感受"我们是探索伙伴"的平等感',
        '🎯 探索任务：每个展厅选1-2件代表文物深度了解，不求多求精',
        '🎭 镇馆之宝民俗传说：传说四羊方尊的羊头在月圆之夜会转动；后母戊鼎曾用来煮龙肉给皇帝吃；人面鱼纹彩陶盆是古代渔民祈祷丰收的神器',
        '🌟 成就确认：参观结束时和孩子总结"我们今天一起学到的新知识"，强调合作学习的成果'
      ],
      '13-18': [
        '🎓 学术准备：预习《中华文明史》相关章节，了解考古学基本方法和文物断代技术',
        '🏛️ 策展理念：理解国博"以史为主线，以文物为支撑"的陈列方式，关注文物与历史的关系',
        '🏺 镇馆之宝学术价值：四羊方尊体现商代失蜡法铸造工艺巅峰，反映青铜文明成熟度；后母戊鼎铭文揭示商王朝祭祀制度；人面鱼纹彩陶盆体现原始宗教观念和艺术审美',
        '🔬 科技考古：了解碳14测年、X光检测、CT扫描等现代文物研究手段',
        '🌍 国际视野：对比世界四大文明古国，分析中华文明"多元一体"的独特性',
        '📊 数据思维：关注文物背后的社会经济信息：人口、技术、贸易、文化交流',
        '🤝 平等对话：与青少年平等讨论历史思考和现代意义，重视他们的独特见解和批判思维',
        '🎯 专业路线：古代中国基本陈列 → 专题特展 → 国际交流展，形成完整知识体系',
        '📝 学术训练：准备研究性学习项目，如"从文物看中国古代科技发展"',
        '💎 价值共创：邀请青少年分享自己的思考和感悟，一起探讨文明传承的现代意义'
      ]
    },
    child: {
      '3-6': [
        '📸 门口打卡：家长给孩子在中国国家博物馆门口拍一张照片',
        '🐑 镇馆之宝：找到「四羊方尊」并合影',
        '🍲 镇馆之宝：找到「后母戊鼎」并合影',
        '😊 镇馆之宝：找到「人面鱼纹彩陶盆」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '7-12': [
        '📸 门口打卡：家长给孩子在中国国家博物馆门口拍一张照片',
        '🐑 镇馆之宝：找到「四羊方尊」并合影',
        '🍲 镇馆之宝：找到「后母戊鼎」并合影',
        '😊 镇馆之宝：找到「人面鱼纹彩陶盆」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '13-18': [
        '📸 门口打卡：家长给孩子在中国国家博物馆门口拍一张照片',
        '🐑 镇馆之宝：找到「四羊方尊」并合影',
        '🍲 镇馆之宝：找到「后母戊鼎」并合影',
        '😊 镇馆之宝：找到「人面鱼纹彩陶盆」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ]
    }
  }
};
