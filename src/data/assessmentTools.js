/**
 * Assessment Tools for Museum Visits
 * Tools for measuring engagement and reflection during parent-child museum experiences
 */

export const ASSESSMENT_TOOLS = {
    engagementIndicators: {
        '3-6': [
            '✅ 孩子主动指向和询问展品',
            '✅ 能专注观察15-20分钟',
            '✅ 愿意分享自己的发现',
            '✅ 表现出好奇和兴奋',
            '✅ 能记住并重复感兴趣的内容'
        ],
        '7-12': [
            '✅ 主动提出深度问题',
            '✅ 能将展品与已学知识连接',
            '✅ 表现出独立探索的欲望',
            '✅ 愿意记录和总结观察',
            '✅ 与他人分享学习心得'
        ],
        '13-18': [
            '✅ 进行批判性思考和分析',
            '✅ 主动寻找更多相关信息',
            '✅ 表达个人观点和见解',
            '✅ 关注文化的现代意义',
            '✅ 思考个人身份和价值观'
        ]
    },
    reflectionPrompts: {
        parentSelfReflection: [
            '我今天有多少时间真正在倾听孩子？',
            '我是否给予了孩子足够的自主探索空间？',
            '我的提问是否激发了孩子的思考？',
            '我是否及时回应了孩子的情感需求？',
            '我今天学到了关于孩子的什么新东西？'
        ],
        familyReflection: [
            '今天我们最有意思的发现是什么？',
            '哪个展品让我们印象最深刻？为什么？',
            '我们学到了什么以前不知道的知识？',
            '今天的博物馆之旅让我们感觉如何？',
            '我们下次想要探索什么主题？'
        ]
    }
};

export default ASSESSMENT_TOOLS;