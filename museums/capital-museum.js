window.MUSEUM_CAPITAL = {
  id: 'beijing-capital-museum',
  name: '首都博物馆',
  location: '北京',
  description: '展示北京历史文化的市属综合性博物馆',
  tags: ['北京历史', '古都文化', '民俗'],
  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Capital_Museum_in_Beijing.jpg/800px-Capital_Museum_in_Beijing.jpg',
  collections: [
    { 
      name: '神兽玉佩', 
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/%E7%A5%9E%E5%85%BD%E7%8E%89%E4%BD%A9.JPG/800px-%E7%A5%9E%E5%85%BD%E7%8E%89%E4%BD%A9.JPG',
      description: '首都博物馆珍贵的玉器藏品，以青玉为材，雕刻神话祥瑞动物形象。玉佩造型生动，工艺精湛，融入浮雕、阴刻等技法，寓意吉祥如意、辟邪纳福，体现了古代玉器艺术的高超水平和礼制文化'
    },
    { 
      name: '董鼎', 
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/%E9%A6%96%E9%83%BD%E5%8D%9A%E7%89%A9%E9%A6%86%E8%97%8F%E8%91%A3%E9%BC%8E.jpg/800px-%E9%A6%96%E9%83%BD%E5%8D%9A%E7%89%A9%E9%A6%86%E8%97%8F%E8%91%A3%E9%BC%8E.jpg',
      description: '西周时期重要的青铜礼器，用于宗庙祭祀和象征权力地位。董鼎造型端庄，器型为传统的三足两耳样式，纹饰以夔龙、云雷等为主，厚重庄严，是研究西周历史、制度和青铜铸造工艺的重要实物资料'
    },
    { 
      name: '象首绂簠', 
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Fu_in_Capital_Museum_China.jpg/800px-Fu_in_Capital_Museum_China.jpg',
      description: '春秋时期精美的青铜礼器，为盛放食物的"簠"类器物。最大特色是装饰有象首造型，象征祥瑞、力量和高贵。采用复杂的分段模铸造工艺，结合写实与装饰性，展现古代冶铸技术的高超水平和独特的美学价值'
    }
  ],
  workflows: [
    {
      id: 'treasure-discovery',
      name: '镇馆之宝探索',
      description: '围绕首都博物馆三大特色藏品的亲子探索路线',
      ages: ['3-6', '7-12', '13-18'],
      tasks: [
        { id: 'gate-photo', role: 'parent', type: 'photo', title: '门口打卡', subtitle: '在首都博物馆门口拍一张照片', ages: ['3-6','7-12','13-18'] },
        { id: 'find-jade', role: 'child', type: 'photo', title: '文化瑰宝 1/3', subtitle: '找到「神兽玉佩」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/%E7%A5%9E%E5%85%BD%E7%8E%89%E4%BD%A9.JPG/800px-%E7%A5%9E%E5%85%BD%E7%8E%89%E4%BD%A9.JPG', ages: ['3-6','7-12','13-18'] },
        { id: 'find-ding', role: 'child', type: 'photo', title: '文化瑰宝 2/3', subtitle: '找到「董鼎」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/%E9%A6%96%E9%83%BD%E5%8D%9A%E7%89%A9%E9%A6%86%E8%97%8F%E8%91%A3%E9%BC%8E.jpg/800px-%E9%A6%96%E9%83%BD%E5%8D%9A%E7%89%A9%E9%A6%86%E8%97%8F%E8%91%A3%E9%BC%8E.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'find-fu', role: 'child', type: 'photo', title: '文化瑰宝 3/3', subtitle: '找到「象首绂簠」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Fu_in_Capital_Museum_China.jpg/800px-Fu_in_Capital_Museum_China.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'victory-photo', role: 'parent', type: 'photo', title: '完成合影', subtitle: '和家长比心/拥抱/击掌，留下美好瞬间！', ages: ['3-6','7-12','13-18'] },
        { id: 'poster', role: 'parent', type: 'poster', title: '成就海报', subtitle: '生成专属成就海报', ages: ['3-6','7-12','13-18'] }
      ]
    },
    {
      id: 'old-beijing-culture',
      name: '老北京文化之旅',
      description: '探索老北京的民俗文化和传统生活',
      ages: ['3-6','7-12'],
      tasks: [
        { id: 'gate-photo', role: 'parent', type: 'photo', title: '门口打卡', subtitle: '首都博物馆门前合影', ages: ['3-6','7-12','13-18'] },
        { id: 'find-hutong', role: 'child', type: 'confirm', title: '胡同探秘', subtitle: '找到胡同模型或图片，了解胡同的故事', ages: ['3-6','7-12'] },
        { id: 'find-opera-mask', role: 'child', type: 'confirm', title: '京剧脸谱', subtitle: '找到京剧脸谱展品，认识不同颜色代表的角色', ages: ['3-6','7-12'] },
        { id: 'find-traditional-toy', role: 'child', type: 'confirm', title: '传统玩具', subtitle: '发现老北京传统玩具（拨浪鼓、空竹、毽子等）', ages: ['3-6','7-12'] },
        { id: 'victory-photo', role: 'parent', type: 'photo', title: '胜利合影', subtitle: '在京城旧事展区合影', ages: ['3-6','7-12','13-18'] },
        { id: 'poster', role: 'parent', type: 'poster', title: '成就海报', subtitle: '生成专属成就海报', ages: ['3-6','7-12','13-18'] }
      ]
    },
    {
      id: 'ancient-capital-history',
      name: '古都历史探索',
      description: '深入了解北京从蓟城到现代都市的演变历程',
      ages: ['7-12','13-18'],
      tasks: [
        { id: 'ancient-beijing-photo', role: 'parent', type: 'photo', title: '古都展区', subtitle: '在古都北京展区前合影', ages: ['7-12','13-18'] },
        { id: 'city-evolution', role: 'child', type: 'confirm', title: '城市演变', subtitle: '找到北京城市发展地图，了解从蓟城到元大都、再到现代北京的变化', ages: ['7-12','13-18'] },
        { id: 'architecture-study', role: 'child', type: 'confirm', title: '建筑艺术', subtitle: '观察四合院、城墙等建筑模型，理解北京传统建筑特色', ages: ['13-18'] },
        { id: 'cultural-heritage', role: 'child', type: 'confirm', title: '文化遗产', subtitle: '学习一项北京非物质文化遗产（京剧、剪纸、风筝等）', ages: ['7-12','13-18'] },
        { id: 'poster', role: 'parent', type: 'poster', title: '成就海报', subtitle: '生成专属成就海报', ages: ['3-6','7-12','13-18'] }
      ]
    }
  ],
  checklists: {
    parent: {
      '3-6': [
        '🎫 入馆指南：免费参观需预约，推荐上午10点时段，五层展厅选择1-2层重点参观避免疲劳',
        '👶 幼儿友好路线：一楼古都北京 → 三楼京城旧事民俗展 → 体验区互动（总时长1.5小时）',
        '🏮 文化启蒙工具：准备小画册记录有趣发现、贴纸奖励、儿童放大镜观察细节',
        '🏛️ 北京古都知识：北京有3000多年建城史，800多年建都史。向孩子介绍北京是元、明、清三朝的首都，有很多古老的建筑和故事',
        '🎭 老北京民俗文化：胡同里的生活很有趣，人们会放风筝、踢毽子、下棋。过年时有舞龙舞狮，还会贴窗花、吃糖葫芦',
        '💕 文化情感连接：当孩子对展品表现好奇时，蹲下来拥抱说"你对北京历史很感兴趣，真棒！"',
        '🏘️ 胡同文化简介：胡同是北京特有的小巷子，名字来自蒙古语"水井"的意思。胡同里住着很多四合院，是老北京人的家',
        '🎨 传统手工艺：北京有很多传统手艺，比如做糖人、剪纸、捏面人、做风筝。这些都是老师傅一代代传下来的技艺',
        '🌟 文化传承庆祝：参观结束时和孩子一起回顾"今天了解的老北京文化"，让孩子感受传统文化的魅力'
      ],
      '7-12': [
        '📱 专业导览：下载"首都博物馆"APP → 选择"青少年路线" → 重点关注古都北京、京城旧事展',
        '📚 北京建城史详解：公元前1045年，周朝在此建立蓟城。1153年金朝迁都于此称中都，1272年元朝建大都，1421年明朝迁都称北京',
        '🏛️ 元明清建都历程：元大都按《周礼》规划，明朝在元大都基础上改建，清朝基本沿用明制。每个朝代都在城市规划上留下了独特印记',
        '🏘️ 胡同文化深度解读：胡同体现了四合院文化，讲究门第礼制。胡同名称多有典故：王府井、什刹海、前门大街都有历史渊源',
        '🎭 京剧艺术知识：京剧融合了昆曲、汉调、秦腔等剧种，分生旦净丑四个行当。唱腔有西皮、二黄两个基本腔调',
        '💫 文化探索鼓励：当孩子提出历史问题时，及时赞美"你的问题很有深度！"一起寻找答案',
        '🏠 老北京生活方式：四合院里的生活讲究礼制，一家三代同堂。有茶馆文化、庙会文化，还有独特的京味小吃如豆汁、炸酱面',
        '🔍 文物时代特征识别：元代文物多有蒙古特色，明代文物工艺精美，清代文物融合满汉文化。通过器型、纹饰、工艺可以判断年代',
        '🎊 文化学习成就庆祝：参观结束时和孩子总结"我们一起学到的北京文化知识"，强调共同探索的收获'
      ],
      '13-18': [
        '🎓 深度历史研习：预习《北京通史》相关章节，了解北京从蓟城到现代都市的完整发展脉络',
        '🏛️ 北京城市发展史研究：从蓟城到中都、大都、北京的演变过程体现了中国古代都城规划的最高水平。元大都采用方格网布局，明清北京城形成"凸"字形格局',
        '🎭 古都文化特色分析：北京古都文化的核心是皇权文化与民俗文化的交融。紫禁城代表皇权威严，胡同四合院体现平民智慧，形成独特的文化层次',
        '💎 文化传承价值探讨：北京古都文化承载着中华文明的精髓，从建筑布局的"天人合一"理念到社会结构的"礼制秩序"，都体现了传统文化的深层价值',
        '🗺️ 城市规划历史研究：北京城规划体现了中国古代"中轴对称"的规划思想，南北中轴线长7.8公里，东西对称布局，体现了古代宇宙观和政治理念',
        '🤝 深度文化对话：与青少年平等探讨传统文化与现代生活的关系，重视他们的独特见解',
        '🎨 民俗文化演变分析：从元代的草原文化到明清的汉文化主导，再到近现代的中西融合，北京民俗文化在传承中不断演变，形成了独特的京味文化',
        '🔬 文物保护工作了解：首都博物馆的文物保护运用现代科技，包括X射线检测、红外光谱分析等。了解文物保护的科学性和重要性，培养文化保护意识',
        '🌟 文化智慧共享：邀请青少年分享对北京文化的思考和感悟，一起探讨传统文化的现代价值'
      ]
    },
    child: {
      '3-6': [
        '📸 门口打卡：家长给孩子在首都博物馆门口拍一张照片',
        '💎 文化瑰宝：找到「神兽玉佩」并合影',
        '🏺 文化瑰宝：找到「董鼎」并合影',
        '🐘 文化瑰宝：找到「象首绂簠」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '7-12': [
        '📸 门口打卡：家长给孩子在首都博物馆门口拍一张照片',
        '💎 文化瑰宝：找到「神兽玉佩」并合影',
        '🏺 文化瑰宝：找到「董鼎」并合影',
        '🐘 文化瑰宝：找到「象首绂簠」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '13-18': [
        '📸 门口打卡：家长给孩子在首都博物馆门口拍一张照片',
        '💎 文化瑰宝：找到「神兽玉佩」并合影',
        '🏺 文化瑰宝：找到「董鼎」并合影',
        '🐘 文化瑰宝：找到「象首绂簠」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ]
    }
  }
};
