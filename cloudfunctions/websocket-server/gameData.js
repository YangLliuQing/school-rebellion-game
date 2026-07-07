/**
 * 游戏数据模块（服务端版本）
 * 从客户端 gameData.js 移植，用于服务端 AI 学生管理
 */

// ===== 姓名库 =====
const SURNAMES = [
  '赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈',
  '褚', '卫', '蒋', '沈', '韩', '杨', '朱', '秦', '许', '何',
  '吕', '张', '孔', '曹', '严', '华', '金', '魏', '陶', '姜',
  '刘', '黄', '林', '徐', '马', '高', '梁', '郭', '罗', '宋'
]

const MALE_NAMES = [
  '浩然', '子涵', '宇轩', '子豪', '俊杰', '志远', '明哲', '天佑',
  '文博', '一鸣', '鹏飞', '嘉懿', '睿渊', '昊天', '思远', '泽宇',
  '伟杰', '建辉', '志强', '文轩', '晓明', '国强', '志豪', '建国',
  '大壮', '铁柱', '狗蛋', '二牛', '小刚', '阿强'
]

const FEMALE_NAMES = [
  '雨萱', '梓涵', '诗涵', '梦琪', '思雨', '语嫣', '晓婷', '雅婷',
  '雪儿', '佳怡', '欣怡', '子萱', '雨桐', '若曦', '静怡', '慧敏',
  '小芳', '翠花', '春梅', '丽丽', '秀英', '玉兰', '桂芳', '淑芬',
  '小红', '阿花', '小美', '婷婷', '丹丹', '芳芳'
]

// ===== 8种学生性格人设 =====
const PERSONALITY_TYPES = [
  {
    id: 'scholar', name: '乖乖学霸', emoji: '📚',
    answerAccuracy: 0.90, chatFrequency: 0.6, activityLevel: 0.7,
    chatStyle: 'serious', descriptions: ['热爱学习', '老师眼中的好学生']
  },
  {
    id: 'troublemaker', name: '调皮捣蛋', emoji: '😈',
    answerAccuracy: 0.45, chatFrequency: 0.95, activityLevel: 0.95,
    chatStyle: 'playful', descriptions: ['课堂捣乱', '喜欢搞怪']
  },
  {
    id: 'slacker', name: '摸鱼摆烂', emoji: '😴',
    answerAccuracy: 0.25, chatFrequency: 0.3, activityLevel: 0.2,
    chatStyle: 'lazy', descriptions: ['上课睡觉', '不想学习']
  },
  {
    id: 'monitor', name: '课代表', emoji: '📋',
    answerAccuracy: 0.80, chatFrequency: 0.8, activityLevel: 0.85,
    chatStyle: 'responsible', descriptions: ['认真负责', '催交作业']
  },
  {
    id: 'rebel', name: '叛逆少年', emoji: '😎',
    answerAccuracy: 0.50, chatFrequency: 0.85, activityLevel: 0.8,
    chatStyle: 'rebellious', descriptions: ['酷拽叛逆', '不服管教']
  },
  {
    id: 'shy', name: '社恐同桌', emoji: '😳',
    answerAccuracy: 0.70, chatFrequency: 0.2, activityLevel: 0.3,
    chatStyle: 'shy', descriptions: ['害羞内向', '话不多']
  },
  {
    id: 'gossip', name: '八卦达人', emoji: '📰',
    answerAccuracy: 0.55, chatFrequency: 0.9, activityLevel: 0.85,
    chatStyle: 'gossipy', descriptions: ['消息灵通', '爱传八卦']
  },
  {
    id: 'athlete', name: '体育健将', emoji: '⚽',
    answerAccuracy: 0.40, chatFrequency: 0.75, activityLevel: 0.9,
    chatStyle: 'casual', descriptions: ['运动达人', '大大咧咧']
  }
]

// ===== AI 聊天话题库 =====
const CHAT_TOPICS = {
  serious: [
    '这道题的解法其实还有另一种思路...',
    '昨天的作业你们都做完了吗？',
    '我觉得这次考试应该不会太难',
    '谁有英语笔记借我看看？',
    '数学老师今天讲的真仔细',
    '我预习了下节课的内容，挺有意思的',
    '要不要组个学习小组？',
    '这次的物理实验报告好难写啊'
  ],
  playful: [
    '嘿嘿嘿，老师转身了我扔个纸团',
    '我刚才在课本上画了个小人哈哈哈哈',
    '你们看窗外那只鸟！',
    '谁要跟我传纸条？',
    '下课去小卖部谁一起？',
    '我昨天在走廊被教导主任抓了🤣',
    '哈哈哈哈你被点名了！',
    '我跟你们说，隔壁班有个超搞笑的事'
  ],
  lazy: [
    'zzz...好困...',
    '这节课还有多久下课啊...',
    '我今天作业一个字没写',
    '中午吃啥好呢...',
    '能不能别点名啊...',
    '好想回家睡觉...',
    '这题也太难了，放弃',
    '课代表，作业借我抄抄呗...'
  ],
  responsible: [
    '大家安静一下，老师要讲课了',
    '谁还没交作业？快点交上来',
    '今天的值日生是谁？',
    '笔记我已经整理好了，谁要？',
    '下节课要考试，大家准备一下',
    '这个知识点很重要，认真听',
    '黑板擦干净了吗？',
    '班长让我通知大家今天放学后开会'
  ],
  rebellious: [
    '这学校规矩真多，烦死了',
    '我不想穿校服，太丑了',
    '放学后去天台不？',
    '这老师讲课太无聊了',
    '谁要翻墙出去？我知道有个洞',
    '考试有什么了不起的',
    '我头发染了个色，你们看得出来吗',
    '教导主任就是个老古董'
  ],
  shy: [
    '那个...有人看到我的笔了吗...',
    '嗯...作业我写完了...',
    '不好意思打扰了...',
    '请问...这个题怎么做...',
    '我...我也觉得是这样...',
    '小声问一下，老师刚才说的啥...'
  ],
  gossipy: [
    '诶诶诶，你们知道吗？隔壁班那个谁...',
    '听说班主任要结婚了！',
    '我跟你们说个秘密...',
    '昨天放学我看见校长在门口吃烤串',
    '你们知道新来的英语老师多大吗？',
    '最新消息！下周可能要换课表！',
    '谁谁谁和谁谁谁好像在一起了！',
    '我打听到一个爆炸性新闻...'
  ],
  casual: [
    '放学打球谁去？',
    '周末要不要一起踢球？',
    '运动会报名了吗？',
    '我今天带了个新篮球',
    '跑步去不去？',
    '你们体育课选什么项目？',
    '我昨天打了一下午球，腿好酸',
    '这天气打球最舒服了'
  ]
}

// ===== 题库 =====
const QUESTION_BANK = [
  // 语文
  { id: 'q1', category: '语文', question: '"床前明月光"的下一句是？', options: ['疑是地上霜', '低头思故乡', '举头望明月', '月是故乡明'], answer: 0, points: 10 },
  { id: 'q2', category: '语文', question: '"春眠不觉晓"的作者是？', options: ['李白', '杜甫', '孟浩然', '白居易'], answer: 2, points: 10 },
  { id: 'q3', category: '语文', question: '下列哪个不是四大名著？', options: ['《红楼梦》', '《西游记》', '《聊斋志异》', '《三国演义》'], answer: 2, points: 10 },
  { id: 'q4', category: '语文', question: '"但愿人长久，千里共婵娟"出自？', options: ['《水调歌头》', '《念奴娇》', '《江城子》', '《声声慢》'], answer: 0, points: 10 },
  { id: 'q5', category: '语文', question: '下列哪个成语使用正确？', options: ['他的成绩首当其冲', '这篇文章不刊之论', '他做事一丝不苟', '今天天气七月流火'], answer: 2, points: 10 },
  { id: 'q6', category: '语文', question: '《背影》的作者是？', options: ['鲁迅', '朱自清', '老舍', '巴金'], answer: 1, points: 10 },
  // 数学
  { id: 'q7', category: '数学', question: '勾股定理中，直角三角形的斜边平方等于？', options: ['两边之和', '两边之差', '两直角边平方和', '两直角边乘积'], answer: 2, points: 10 },
  { id: 'q8', category: '数学', question: '圆的面积公式是？', options: ['πr', '2πr', 'πr²', '2πr²'], answer: 2, points: 10 },
  { id: 'q9', category: '数学', question: '3² + 4² = ?', options: ['7', '12', '25', '49'], answer: 2, points: 10 },
  { id: 'q10', category: '数学', question: '一元二次方程 ax²+bx+c=0 的判别式是？', options: ['b²-4ac', 'b²+4ac', 'a²-4bc', '4ac-b²'], answer: 0, points: 15 },
  { id: 'q11', category: '数学', question: 'sin 30° 等于？', options: ['1', '√2/2', '1/2', '√3/2'], answer: 2, points: 10 },
  { id: 'q12', category: '数学', question: '下列哪个是质数？', options: ['21', '27', '29', '33'], answer: 2, points: 10 },
  // 英语
  { id: 'q13', category: '英语', question: '"apple" 的中文意思是？', options: ['香蕉', '苹果', '橘子', '葡萄'], answer: 1, points: 5 },
  { id: 'q14', category: '英语', question: '"Thank you" 是什么意思？', options: ['对不起', '再见', '谢谢', '你好'], answer: 2, points: 5 },
  { id: 'q15', category: '英语', question: '下列哪个单词拼写正确？', options: ['beautifull', 'beautiful', 'beatiful', 'beutiful'], answer: 1, points: 10 },
  { id: 'q16', category: '英语', question: '"I __ a student." 填什么？', options: ['is', 'are', 'am', 'be'], answer: 2, points: 10 },
  { id: 'q17', category: '英语', question: '"She ___ to school every day."', options: ['go', 'goes', 'going', 'gone'], answer: 1, points: 10 },
  { id: 'q18', category: '英语', question: '"interested" 后面跟什么介词？', options: ['at', 'on', 'in', 'for'], answer: 2, points: 15 },
  // 趣味题
  { id: 'q19', category: '趣味', question: '《西游记》中孙悟空有几个筋斗云？', options: ['一个筋斗十万八千里', '一个筋斗九万里', '一个筋斗五万里', '一个筋斗八千里'], answer: 0, points: 5 },
  { id: 'q20', category: '趣味', question: '中国最长的河流是？', options: ['黄河', '长江', '珠江', '淮河'], answer: 1, points: 10 },
  { id: 'q21', category: '趣味', question: '奥运五环中蓝色代表哪个洲？', options: ['亚洲', '非洲', '欧洲', '美洲'], answer: 2, points: 15 },
  { id: 'q22', category: '趣味', question: '一年有多少个节气？', options: ['12个', '24个', '36个', '48个'], answer: 1, points: 10 },
  { id: 'q23', category: '趣味', question: '地球绕太阳一周需要多长时间？', options: ['一个月', '半年', '一年', '一天'], answer: 2, points: 5 },
  { id: 'q24', category: '趣味', question: '被称为"杂交水稻之父"的是？', options: ['钱学森', '袁隆平', '邓稼先', '李四光'], answer: 1, points: 10 },
  // 怀旧题
  { id: 'q25', category: '怀旧', question: '80后小时候玩的"跳房子"用的是什么？', options: ['粉笔画格子', '纸折的格子', '布做的格子', '木头做的格子'], answer: 0, points: 5 },
  { id: 'q26', category: '怀旧', question: '《还珠格格》中小燕子的真名叫什么？', options: ['方慈', '夏紫薇', '小燕子', '方瑜'], answer: 0, points: 10 },
  { id: 'q27', category: '怀旧', question: '小霸王学习机最常用的是？', options: ['学习', '玩游戏', '打字', '画画'], answer: 1, points: 5 },
  { id: 'q28', category: '怀旧', question: '大大泡泡糖里经常有什么？', options: ['贴纸', '玩具', '卡片', '硬币'], answer: 0, points: 5 },
  { id: 'q29', category: '怀旧', question: '80后的课间操一般叫什么？', options: ['广播体操', '广场舞', '健美操', '武术操'], answer: 0, points: 5 },
  { id: 'q30', category: '怀旧', question: '小时候吃的"唐僧肉"其实是什么？', options: ['辣条', '牛肉干', '糖果', '话梅'], answer: 0, points: 10 },
  { id: 'q31', category: '怀旧', question: '以下哪个是80年代经典动画片？', options: ['喜羊羊', '熊出没', '葫芦娃', '小猪佩奇'], answer: 2, points: 5 },
  { id: 'q32', category: '怀旧', question: '小时候用的橡皮擦经常有什么图案？', options: ['水果', '动物', '明星', '以上都是'], answer: 3, points: 5 },
  { id: 'q33', category: '怀旧', question: '80后上学的书包通常是？', options: ['双肩包', '斜挎包', '手提包', '拉杆包'], answer: 0, points: 5 }
]

// ===== 工具函数 =====
function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateId() {
  return 'ai_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id = ''
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

// ===== 学生生成 =====
function generateStudent(id) {
  const gender = Math.random() > 0.5 ? 'male' : 'female'
  const surname = randomPick(SURNAMES)
  const givenName = randomPick(gender === 'male' ? MALE_NAMES : FEMALE_NAMES)
  const personality = PERSONALITY_TYPES[Math.floor(Math.random() * PERSONALITY_TYPES.length)]
  
  return {
    id: id || generateId(),
    name: surname + givenName,
    gender,
    personality,
    score: 0,
    isOnline: Math.random() > 0.1,
    isPlayer: false
  }
}

function generateAIChatMessage(student) {
  const style = student.personality.chatStyle
  const topics = CHAT_TOPICS[style] || CHAT_TOPICS.casual
  return randomPick(topics)
}

module.exports = {
  PERSONALITY_TYPES,
  QUESTION_BANK,
  CHAT_TOPICS,
  randomPick,
  randomInt,
  generateId,
  generateRoomId,
  generateStudent,
  generateAIChatMessage
}
