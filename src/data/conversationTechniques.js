/**
 * Conversation Techniques for Different Age Groups
 * Specific conversation strategies and question types optimized for each developmental stage
 */

export const CONVERSATION_TECHNIQUES = {
    '3-6': {
        questionTypes: {
            observation: ['你看到了什么颜色？', '这个像什么形状？', '你发现了几个小动物？'],
            sensory: ['摸起来会是什么感觉？', '听起来像什么声音？', '闻起来是什么味道？'],
            imagination: ['你觉得这是做什么用的？', '古代小朋友会怎么玩？', '如果是你的会怎么用？'],
            emotional: ['你喜欢这个吗？', '这让你想到什么开心的事？', '你觉得美不美？']
        },
        responseStrategies: [
            '重复孩子的话表示理解',
            '用"哇"、"真的吗"等感叹表达共鸣',
            '将孩子的观察与生活经验连接',
            '给予具体的表扬："你的眼睛真厉害"'
        ]
    },
    '7-12': {
        questionTypes: {
            analysis: ['为什么会这样设计？', '你能找出什么规律？', '这和那个有什么不同？'],
            connection: ['这让你想起了什么？', '和你学过的知识有关系吗？', '现在还有类似的吗？'],
            evaluation: ['你觉得哪个更好？为什么？', '如果是你会怎么改进？', '什么地方最有趣？'],
            creation: ['你能设计一个类似的吗？', '如果你是工匠会怎么做？', '能想出新的用法吗？']
        },
        responseStrategies: [
            '认真倾听孩子的想法',
            '用"原来如此"、"你说得有道理"回应',
            '提出延伸问题引导深入思考',
            '分享自己的观点但不强加'
        ]
    },
    '13-18': {
        questionTypes: {
            critical: ['你如何评价这种观点？', '有什么不同的角度？', '这反映了什么问题？'],
            philosophical: ['这说明了什么价值观？', '对现代有什么意义？', '你的人生感悟是什么？'],
            creative: ['如果重新设计会怎样？', '现代技术能如何改进？', '你会如何创新？'],
            social: ['这对社会有什么影响？', '不同文化会如何处理？', '未来会如何发展？']
        },
        responseStrategies: [
            '平等对话，避免权威姿态',
            '承认他们观点的价值',
            '分享而非灌输自己的见解',
            '鼓励独立思考和判断'
        ]
    }
};

export default CONVERSATION_TECHNIQUES;