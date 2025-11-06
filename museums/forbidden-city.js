window.MUSEUM_FORBIDDEN_CITY = {
  id: 'forbidden-city',
  name: '故宫博物院',
  location: '北京',
  description: '世界上现存规模最大、保存最为完整的木质结构古建筑群',
  tags: ['历史', '建筑', '文物'],
  image: 'http://eb118-file.cdn.bcebos.com/upload/c67a7249b6884703bfc8faceb3a8ad9d_2209653549.png?x-bce-process=image/format,f_auto/resize,m_lfit,limit_1,w_500,h_500/quality,q_85',
  collections: [
    { 
      name: '《清明上河图》', 
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/79/%E6%B8%85%E6%98%8E%E4%B8%8A%E6%B2%B3%E5%9B%BE.jpg',
      description: '北宋画家张择端作品，全长528厘米，画了814个人物，运用散点透视法，是中国绘画史上的里程碑，被誉为"中华第一神品"'
    },
    { 
      name: '金瓯永固杯', 
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/%E9%87%91%E7%93%AF%E6%B0%B8%E5%9B%BA%E6%9D%AF_%E6%95%85%E5%AE%AB%E7%8F%8D%E5%AE%9D%E9%A6%86.jpg/800px-%E9%87%91%E7%93%AF%E6%B0%B8%E5%9B%BA%E6%9D%AF_%E6%95%85%E5%AE%AB%E7%8F%8D%E5%AE%9D%E9%A6%86.jpg',
      description: '清代乾隆皇帝专用的金质酒杯，每逢新年举行开笔仪式时使用，寓意国家江山永固。杯体以黄金、珍珠、宝石精雕细琢，代表清代皇家金器的顶级水准'
    },
    { 
      name: '酗亚方尊', 
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Shang_dynasty_inscribed_Ya_Chou_square_zun.jpg/600px-Shang_dynasty_inscribed_Ya_Chou_square_zun.jpg',
      description: '商代青铜器精品，盛酒器，外形方正、纹饰独特，铭文记载了商代祭祀制度，是中国青铜器中的国宝，被誉为"青铜之冠"'
    }
  ],
  workflows: [
    {
      id: 'treasure-discovery',
      name: '镇馆之宝探索',
      description: '围绕故宫三大镇馆之宝的亲子探索路线',
      ages: ['3-6', '7-12', '13-18'],
      tasks: [
        { id: 'gate-photo', role: 'parent', type: 'photo', title: '门口打卡', subtitle: '在午门前拍一张照片', ages: ['3-6','7-12','13-18'] },
        { id: 'find-qingming', role: 'child', type: 'photo', title: '镇馆之宝 1/3', subtitle: '找到「清明上河图」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/79/%E6%B8%85%E6%98%8E%E4%B8%8A%E6%B2%B3%E5%9B%BE.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'find-jinoucup', role: 'child', type: 'photo', title: '镇馆之宝 2/3', subtitle: '找到「金瓯永固杯」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/%E9%87%91%E7%93%AF%E6%B0%B8%E5%9B%BA%E6%9D%AF_%E6%95%85%E5%AE%AB%E7%8F%8D%E5%AE%9D%E9%A6%86.jpg/800px-%E9%87%91%E7%93%AF%E6%B0%B8%E5%9B%BA%E6%9D%AF_%E6%95%85%E5%AE%AB%E7%8F%8D%E5%AE%9D%E9%A6%86.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'find-fangzun', role: 'child', type: 'photo', title: '镇馆之宝 3/3', subtitle: '找到「酗亚方尊」并合影', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Shang_dynasty_inscribed_Ya_Chou_square_zun.jpg/600px-Shang_dynasty_inscribed_Ya_Chou_square_zun.jpg', ages: ['3-6','7-12','13-18'] },
        { id: 'victory-photo', role: 'parent', type: 'photo', title: '完成合影', subtitle: '和家长比心/拥抱/击掌，留下美好瞬间！', ages: ['3-6','7-12','13-18'] },
        { id: 'poster', role: 'parent', type: 'poster', title: '成就海报', subtitle: '生成专属成就海报', ages: ['3-6','7-12','13-18'] }
      ]
    },
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
    }
  ],
  checklists: {
    parent: {
      '3-6': [
        '🌸 出发仪式感：出门前蹲下拥抱孩子，温柔说"今天我们一起去探索皇帝的宝藏，妈妈/爸爸好期待！"',
        '💝 发现鼓励：每当孩子指着宫殿或展品说话，立即蹲下同视线，认真倾听，温柔说"宝贝的眼睛真厉害！"',
        '🤗 身体接触：看到孩子开心时主动牵手、拥抱，说"和你在一起真开心"',
        '🎊 即时庆祝：每找到一个宝物就击掌庆祝，真诚说"我们配合得太棒了！"',
        '💞 温柔引导：当孩子想跑开时，温柔牵手说"我们一起去看看那边还有什么惊喜"',
        '🌟 积极肯定：多说"你今天真勇敢""你的想法很特别""我好喜欢和你一起"',
        '😴 睡前回忆：晚上躺在床上，温柔回顾"今天最喜欢的宝物是什么？"认真倾听并拥抱'
      ],
      '7-12': [
        '🤝 探索伙伴：出发前真诚告诉孩子"今天我们是平等的探索伙伴"，准备小本子一起记录发现',
        '💬 好奇鼓励：当孩子提出任何问题时，先说"这个问题太棒了！"再一起寻找答案',
        '🌟 发现庆祝：每当孩子找到《清明上河图》、金瓯永固杯等展品时，真诚赞美"你观察得好仔细，我都没想到这个角度！"',
        '🏮 共情连接：在珍宝馆和孩子一起欣赏文物，温柔说"这些工匠就像你做作业一样认真呢"',
        '💫 平等对话：用提问代替说教"你觉得为什么皇帝需要这么多宫殿？"认真倾听孩子的每个想法',
        '🎯 兴趣支持：当孩子对某个展品特别感兴趣时，放慢脚步，真诚说"我也想多了解一下"',
        '🎊 成就确认：参观结束时真诚说"今天和你一起探索故宫，我学到了很多，谢谢你的分享"',
        '📖 延伸分享：回家一起制作"故宫探险日记"，认真倾听孩子讲述每个发现，真诚赞美他的表达'
      ],
      '13-18': [
        '🎓 尊重独立：出发前轻松说"今天你是主导，我就是个好奇的旁听者"，给予充分空间',
        '💫 平等对话：用"你怎么看？""我很好奇你的观点"等开放式提问，认真倾听不打断',
        '🌟 价值认同：当孩子分享见解时，真诚回应"这个角度我真没想到""你的思考让我有新启发"',
        '🤝 思想交流：在展品前分享自己的感受，说"我有个不成熟的想法"营造平等氛围',
        '🏮 柔软陪伴：当孩子沉默或不耐烦时，温柔说"没关系，我们慢慢看"不强求',
        '💞 真诚倾听：对孩子关于历史文化的任何想法都认真回应，说"这个观察很深刻"',
        '🎊 成长确认：参观结束时真诚说"今天和你聊天我收获很大，你越来越有自己的想法了"',
        '📖 后续连接：回家后说"我在想你说的那个观点"保持思想交流，让孩子感到被重视'
      ]
    },
    child: {
      '3-6': [
        '📸 门口打卡：家长给孩子在午门前拍一张照片',
        '🖼️ 镇馆之宝：找到「清明上河图」并合影',
        '🏆 镇馆之宝：找到「金瓯永固杯」并合影',
        '⚱️ 镇馆之宝：找到「酗亚方尊」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '7-12': [
        '📸 门口打卡：家长给孩子在午门前拍一张照片',
        '🖼️ 镇馆之宝：找到「清明上河图」并合影',
        '🏆 镇馆之宝：找到「金瓯永固杯」并合影',
        '⚱️ 镇馆之宝：找到「酗亚方尊」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ],
      '13-18': [
        '📸 门口打卡：家长给孩子在午门前拍一张照片',
        '🖼️ 镇馆之宝：找到「清明上河图」并合影',
        '🏆 镇馆之宝：找到「金瓯永固杯」并合影',
        '⚱️ 镇馆之宝：找到「酗亚方尊」并合影',
        '📸 亲子合影：和家长比心/拥抱/击掌等动作合影'
      ]
    }
  }
};
