/**
 * 80后校园模拟系统 - 核心数据
 * 包含：学生角色生成、老师角色、课表系统、题库
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
export const PERSONALITY_TYPES = [
  {
    id: 'top_student',
    name: '乖乖学霸',
    emoji: '📚',
    traits: ['认真听讲', '积极举手', '记笔记狂魔'],
    answerAccuracy: 0.9,     // 答题正确率
    chatFrequency: 0.3,      // 发言频率
    chatStyle: 'serious',    // 聊天风格
    chatPhrases: [
      '这道题我昨天刚好复习过！',
      '老师，我有个更简单的解法。',
      '大家安静一下，好好听课。',
      '笔记借你抄吧，下次记得自己记。'
    ],
    activityLevel: 0.7,      // 活跃度
    color: '#8ecae6'         // 标签颜色
  },
  {
    id: 'troublemaker',
    name: '调皮捣蛋',
    emoji: '😈',
    traits: ['传纸条', '做鬼脸', '接话茬'],
    answerAccuracy: 0.4,
    chatFrequency: 0.9,
    chatStyle: 'playful',
    chatPhrases: [
      '老师，我要上厕所！',
      '哈哈哈哈谁把粉笔藏起来了？',
      '放学别走，操场见！',
      '我作业被狗吃了，真的！'
    ],
    activityLevel: 0.95,
    color: '#f2a7b3'
  },
  {
    id: 'slacker',
    name: '摸鱼摆烂',
    emoji: '😴',
    traits: ['趴桌睡觉', '偷看小说', '发呆走神'],
    answerAccuracy: 0.25,
    chatFrequency: 0.4,
    chatStyle: 'lazy',
    chatPhrases: [
      '还有几分钟下课啊...',
      'Zzz...老师别叫我...',
      '啥？刚才讲到哪了？',
      '能不能快进到放学？'
    ],
    activityLevel: 0.2,
    color: '#c4b998'
  },
  {
    id: 'class_rep',
    name: '课代表',
    emoji: '📋',
    traits: ['收作业', '发卷子', '帮老师跑腿'],
    answerAccuracy: 0.75,
    chatFrequency: 0.5,
    chatStyle: 'responsible',
    chatPhrases: [
      '各组把作业交一下！',
      '老师说下节课要抽查背诵。',
      '值日生别忘了擦黑板。',
      '我去办公室拿卷子，谁帮我一起？'
    ],
    activityLevel: 0.65,
    color: '#81b29a'
  },
  {
    id: 'rebel',
    name: '叛逆少年',
    emoji: '🖤',
    traits: ['上课戴耳机', '校服不好好穿', '酷酷的'],
    answerAccuracy: 0.45,
    chatFrequency: 0.5,
    chatStyle: 'cool',
    chatPhrases: [
      '这课有什么好听的，无聊。',
      '别管我，我就这样。',
      '切，又是考试。',
      '（戴着耳机假装没听见）'
    ],
    activityLevel: 0.4,
    color: '#e07a5f'
  },
  {
    id: 'shy_desk',
    name: '社恐同桌',
    emoji: '😳',
    traits: ['不爱说话', '画画小能手', '偷偷看窗外'],
    answerAccuracy: 0.6,
    chatFrequency: 0.15,
    chatStyle: 'shy',
    chatPhrases: [
      '嗯...那个...',
      '（小声）这道题选C...',
      '可以...借我一支笔吗...',
      '（低头在本子上画画）'
    ],
    activityLevel: 0.25,
    color: '#d4c5a9'
  },
  {
    id: 'gossiper',
    name: '八卦达人',
    emoji: '🍉',
    traits: ['消息灵通', '爱吃零食', '话很多'],
    answerAccuracy: 0.55,
    chatFrequency: 0.85,
    chatStyle: 'gossipy',
    chatPhrases: [
      '哎你们听说了吗？隔壁班...',
      '我刚才看到班主任在走廊...',
      '谁有零食分我一点？',
      '最新消息！下周要换座位了！'
    ],
    activityLevel: 0.8,
    color: '#f2cc8f'
  },
  {
    id: 'sporty',
    name: '体育健将',
    emoji: '⚽',
    traits: ['下课第一个冲出去', '校队成员', '上课养精蓄锐'],
    answerAccuracy: 0.5,
    chatFrequency: 0.55,
    chatStyle: 'energetic',
    chatPhrases: [
      '下课踢球不？操场集合！',
      '运动会我一定要拿第一！',
      '老师，体育课能不能别占？',
      '走，一起去打篮球！'
    ],
    activityLevel: 0.75,
    color: '#f4a261'
  }
]

// ===== 老师角色 =====
export const TEACHERS = {
  chinese: {
    id: 'teacher_chinese',
    name: '李老师',
    subject: '语文',
    gender: 'female',
    emoji: '👩‍🏫',
    personality: '温柔但严格',
    style: '博学多才，喜欢引经据典',
    catchphrases: [
      '书中自有黄金屋，书中自有颜如玉。',
      '背诵全文！明天检查！',
      '谁能说出这句诗的下半句？'
    ]
  },
  math: {
    id: 'teacher_math',
    name: '王老师',
    subject: '数学',
    gender: 'male',
    emoji: '👨‍🏫',
    personality: '严谨认真',
    style: '逻辑清晰，喜欢出刁钻题目',
    catchphrases: [
      '这题很简单，我只讲三遍。',
      '公式要记住，考试必考！',
      '谁的作业没交？站起来！'
    ]
  },
  english: {
    id: 'teacher_english',
    name: 'Miss Chen',
    subject: '英语',
    gender: 'female',
    emoji: '👩‍🏫',
    personality: '时尚洋气',
    style: '喜欢英语角互动，偶尔放英文歌',
    catchphrases: [
      'Good morning, class!',
      '来，跟着我读一遍。',
      '英语要多开口，别害羞！'
    ]
  },
  pe: {
    id: 'teacher_pe',
    name: '张老师',
    subject: '体育',
    gender: 'male',
    emoji: '💪',
    personality: '豪爽阳光',
    style: '哨子不离身，喜欢组织比赛',
    catchphrases: [
      '集合！先跑两圈热身！',
      '自由活动！注意安全！',
      '男生一队女生一队，比赛！'
    ]
  },
  art: {
    id: 'teacher_art',
    name: '赵老师',
    subject: '美术',
    gender: 'female',
    emoji: '🎨',
    personality: '文艺范',
    style: '温柔耐心，喜欢夸学生有创意',
    catchphrases: [
      '发挥你们的想象力~',
      '画得真好，很有天赋！',
      '今天我们来画校园风景。'
    ]
  },
  head_teacher: {
    id: 'teacher_head',
    name: '刘老师',
    subject: '班主任/政治',
    gender: 'female',
    emoji: '👀',
    personality: '严厉但护犊子',
    style: '经常在后门窗户偷看，但班里出事第一个护着',
    catchphrases: [
      '我从走廊就听到你们班的声音了！',
      '这次考试全班平均分必须进前三！',
      '谁又没交作业？放学留下来！'
    ]
  }
}

// ===== 每日课表生成 =====
const SUBJECTS = ['语文', '数学', '英语', '体育', '美术', '音乐', '自习', '班会']

export function generateSchedule() {
  const periods = [
    { time: '08:00-08:45', name: '早读', type: 'morning_reading', icon: '📖' },
    { time: '08:55-09:40', name: '', type: 'class', icon: '' },
    { time: '09:50-10:35', name: '', type: 'class', icon: '' },
    { time: '10:35-10:55', name: '课间操', type: 'break_exercise', icon: '🏃' },
    { time: '10:55-11:40', name: '', type: 'class', icon: '' },
    { time: '11:50-12:35', name: '', type: 'class', icon: '' },
    { time: '12:35-14:00', name: '午休', type: 'lunch_break', icon: '🍱' },
    { time: '14:00-14:45', name: '', type: 'class', icon: '' },
    { time: '14:55-15:40', name: '', type: 'class', icon: '' },
    { time: '15:50-16:35', name: '', type: 'class', icon: '' },
    { time: '16:45-17:30', name: '自习', type: 'self_study', icon: '✏️' },
    { time: '17:30-18:30', name: '放学', type: 'after_school', icon: '🏠' }
  ]

  // 随机填充课程
  const subjectIcons = { '语文': '📝', '数学': '🔢', '英语': '🌍', '体育': '⚽', '美术': '🎨', '音乐': '🎵', '自习': '✏️', '班会': '📢' }
  const shuffled = [...SUBJECTS].sort(() => Math.random() - 0.5)
  
  let subjectIdx = 0
  return periods.map(p => {
    if (p.type === 'class' || p.type === 'self_study') {
      const subject = shuffled[subjectIdx % shuffled.length]
      subjectIdx++
      return { ...p, name: subject, icon: subjectIcons[subject] || '📚' }
    }
    return p
  })
}

// ===== 题库系统 =====
export const QUESTION_BANK = [
  // 语文题
  { id: 1, subject: '语文', type: 'choice', difficulty: 1, question: '"床前明月光"的下一句是？', options: ['疑是地上霜', '低头思故乡', '举头望明月', '月是故乡明'], answer: 0, points: 10 },
  { id: 2, subject: '语文', type: 'choice', difficulty: 1, question: '"春蚕到死丝方尽"出自哪位诗人？', options: ['李白', '杜甫', '李商隐', '白居易'], answer: 2, points: 10 },
  { id: 3, subject: '语文', type: 'choice', difficulty: 2, question: '"但愿人长久，千里共婵娟"中的"婵娟"指什么？', options: ['嫦娥', '月亮', '美女', '团圆'], answer: 1, points: 15 },
  { id: 4, subject: '语文', type: 'choice', difficulty: 1, question: '《红楼梦》的作者是？', options: ['罗贯中', '施耐庵', '曹雪芹', '吴承恩'], answer: 2, points: 10 },
  { id: 5, subject: '语文', type: 'choice', difficulty: 2, question: '下列哪个成语使用正确？', options: ['差强人意（勉强满意）', '炙手可热（很受欢迎）', '首当其冲（最先受到攻击）', '美轮美奂（形容建筑）'], answer: 3, points: 15 },
  { id: 6, subject: '语文', type: 'choice', difficulty: 1, question: '"少壮不努力"的下一句？', options: ['老大徒伤悲', '老大不小了', '老大很后悔', '老大没办法'], answer: 0, points: 10 },
  { id: 7, subject: '语文', type: 'choice', difficulty: 2, question: '鲁迅的原名是？', options: ['周作人', '周树人', '周建人', '周国平'], answer: 1, points: 15 },
  { id: 8, subject: '语文', type: 'choice', difficulty: 1, question: '"三人行，必有我师焉"出自？', options: ['《孟子》', '《论语》', '《大学》', '《中庸》'], answer: 1, points: 10 },

  // 数学题
  { id: 20, subject: '数学', type: 'choice', difficulty: 1, question: '1 + 2 + 3 + ... + 100 = ?', options: ['4950', '5050', '5150', '5000'], answer: 1, points: 10 },
  { id: 21, subject: '数学', type: 'choice', difficulty: 1, question: '一个三角形的内角和是多少度？', options: ['90°', '180°', '270°', '360°'], answer: 1, points: 10 },
  { id: 22, subject: '数学', type: 'choice', difficulty: 2, question: '如果 x² = 64，那么 x = ?', options: ['8', '±8', '64', '±64'], answer: 1, points: 15 },
  { id: 23, subject: '数学', type: 'choice', difficulty: 1, question: '圆的周长公式是？', options: ['πr', '2πr', 'πr²', '2πr²'], answer: 1, points: 10 },
  { id: 24, subject: '数学', type: 'choice', difficulty: 2, question: '下列哪个是质数？', options: ['91', '97', '99', '93'], answer: 1, points: 15 },
  { id: 25, subject: '数学', type: 'choice', difficulty: 2, question: '勾股定理中，3² + 4² = ?', options: ['5²', '6²', '7²', '25'], answer: 0, points: 15 },
  { id: 26, subject: '数学', type: 'choice', difficulty: 1, question: '正方形面积公式？', options: ['长×宽', '边长²', '边长×2', '边长×4'], answer: 1, points: 10 },

  // 英语题
  { id: 40, subject: '英语', type: 'choice', difficulty: 1, question: '"apple" 的中文意思是？', options: ['香蕉', '苹果', '橘子', '西瓜'], answer: 1, points: 10 },
  { id: 41, subject: '英语', type: 'choice', difficulty: 1, question: '"Hello" 是什么意思？', options: ['再见', '你好', '谢谢', '对不起'], answer: 1, points: 10 },
  { id: 42, subject: '英语', type: 'choice', difficulty: 2, question: '"I ___ a student." 横线填什么？', options: ['is', 'am', 'are', 'be'], answer: 1, points: 15 },
  { id: 43, subject: '英语', type: 'choice', difficulty: 1, question: '"Thank you" 的回复是？', options: ['Sorry', 'You\'re welcome', 'Goodbye', 'Hello'], answer: 1, points: 10 },
  { id: 44, subject: '英语', type: 'choice', difficulty: 2, question: '"book" 的复数是？', options: ['bookes', 'books', 'bookies', 'book'], answer: 1, points: 15 },
  { id: 45, subject: '英语', type: 'choice', difficulty: 2, question: '下列哪个不是颜色词？', options: ['red', 'blue', 'table', 'green'], answer: 2, points: 15 },

  // 趣味脑洞题
  { id: 60, subject: '趣味', type: 'choice', difficulty: 1, question: '上课偷偷吃零食，最怕什么？', options: ['被同桌发现', '被老师点名', '零食掉地上', '没有水喝'], answer: 1, points: 5 },
  { id: 61, subject: '趣味', type: 'choice', difficulty: 1, question: '考试时最后一道选择题不会，通常选什么？', options: ['A', 'B', 'C', 'D（三长一短选最短）'], answer: 2, points: 5 },
  { id: 62, subject: '趣味', type: 'choice', difficulty: 1, question: '课间十分钟最想做什么？', options: ['睡觉', '去小卖部', '抄作业', '聊天'], answer: 1, points: 5 },
  { id: 63, subject: '趣味', type: 'choice', difficulty: 1, question: '班主任从后门窗户看的时候，你应该？', options: ['继续玩', '假装看书', '回头看老师', '叫同桌看'], answer: 1, points: 5 },
  { id: 64, subject: '趣味', type: 'choice', difficulty: 1, question: '8090后最经典的课间游戏是？', options: ['王者荣耀', '跳皮筋/丢沙包', '刷抖音', '吃鸡'], answer: 1, points: 5 },
  { id: 65, subject: '趣味', type: 'choice', difficulty: 1, question: '被老师叫去办公室通常意味着？', options: ['表扬', '批评', '帮忙搬东西', '以上都有可能'], answer: 3, points: 5 },
  { id: 66, subject: '趣味', type: 'choice', difficulty: 1, question: '最让人开心的上课铃声是？', options: ['上课铃', '下课铃', '预备铃', '集合铃'], answer: 1, points: 5 },

  // 怀旧校园梗
  { id: 80, subject: '怀旧', type: 'choice', difficulty: 1, question: '8090后小时候最流行的零食是？', options: ['辣条', '薯片', '巧克力', '饼干'], answer: 0, points: 5 },
  { id: 81, subject: '怀旧', type: 'choice', difficulty: 1, question: '教室里的黑板擦通常被藏在哪里？', options: ['讲台抽屉', '黑板顶上', '垃圾桶里', '老师办公室'], answer: 1, points: 5 },
  { id: 82, subject: '怀旧', type: 'choice', difficulty: 1, question: '值日生最不想干的活是？', options: ['擦黑板', '扫地', '倒垃圾', '拖厕所'], answer: 3, points: 5 },
  { id: 83, subject: '怀旧', type: 'choice', difficulty: 1, question: '当年最火的动画片是？', options: ['黑猫警长', '小猪佩奇', '汪汪队', '超级飞侠'], answer: 0, points: 5 },
  { id: 84, subject: '怀旧', type: 'choice', difficulty: 1, question: '同桌的"三八线"是用什么画的？', options: ['铅笔', '粉笔', '圆珠笔', '修正液'], answer: 1, points: 5 },
]

// ===== 学生生成器 =====
let idCounter = 0

export function generateStudent(personalityType) {
  const isMale = Math.random() > 0.5
  const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)]
  const givenNames = isMale ? MALE_NAMES : FEMALE_NAMES
  const givenName = givenNames[Math.floor(Math.random() * givenNames.length)]
  
  const personality = personalityType || PERSONALITY_TYPES[Math.floor(Math.random() * PERSONALITY_TYPES.length)]
  
  return {
    id: `student_${++idCounter}`,
    name: surname + givenName,
    gender: isMale ? 'male' : 'female',
    personality: personality,
    score: Math.floor(Math.random() * 200),
    mood: ['happy', 'normal', 'sleepy', 'excited'][Math.floor(Math.random() * 4)],
    isOnline: Math.random() > 0.2,
    seatRow: 0,
    seatCol: 0
  }
}

export function generateClass(className, grade) {
  idCounter = 0
  const students = []
  
  // 确保每种人格至少有4-6人
  PERSONALITY_TYPES.forEach((pt, idx) => {
    const count = 4 + Math.floor(Math.random() * 3) // 4-6人
    for (let i = 0; i < count; i++) {
      students.push(generateStudent(pt))
    }
  })
  
  // 补齐到40人
  while (students.length < 40) {
    students.push(generateStudent())
  }
  
  // 打乱顺序
  students.sort(() => Math.random() - 0.5)
  
  // 分配座位（8列5排）
  students.forEach((s, i) => {
    s.seatRow = Math.floor(i / 8)
    s.seatCol = i % 8
  })
  
  return {
    id: `class_${Date.now()}`,
    name: className || `${grade}年级${Math.floor(Math.random() * 10 + 1)}班`,
    grade: grade || '初三',
    school: '育才中学',
    students,
    schedule: generateSchedule()
  }
}

// ===== 当前时间段判断 =====
export function getCurrentPeriod(schedule) {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  
  // 模拟时间（为了方便演示，使用偏移）
  const simulatedMinutes = ((currentMinutes + 0) % (24 * 60))
  
  for (const period of schedule) {
    const [startStr, endStr] = period.time.split('-')
    const [sh, sm] = startStr.split(':').map(Number)
    const [eh, em] = endStr.split(':').map(Number)
    const startMin = sh * 60 + sm
    const endMin = eh * 60 + em
    
    if (simulatedMinutes >= startMin && simulatedMinutes < endMin) {
      return period
    }
  }
  
  // 默认放学状态
  return { time: '--', name: '放学后', type: 'after_school', icon: '🌙' }
}

// ===== 获取课程状态 =====
export function getClassStatus(schedule) {
  const period = getCurrentPeriod(schedule)
  
  if (period.type === 'class' || period.type === 'morning_reading' || period.type === 'self_study') {
    return 'in_class' // 上课中
  } else if (period.type === 'after_school') {
    return 'after_school' // 放学
  } else {
    return 'break' // 课间
  }
}

// ===== AI聊天消息生成 =====
const CHAT_TOPICS = [
  '作业', '考试', '老师', '食堂', '体育课', '周末', '追剧',
  '游戏', '八卦', '零食', '换座位', '运动会', '考试排名'
]

export function generateAIChatMessage(student) {
  const phrases = student.personality.chatPhrases
  const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)]
  
  // 偶尔加入话题相关
  if (Math.random() > 0.5) {
    const topic = CHAT_TOPICS[Math.floor(Math.random() * CHAT_TOPICS.length)]
    const topicPhrases = [
      `说到${topic}，我有话要说...`,
      `你们觉得${topic}怎么样？`,
      `${topic}这件事你们听说了吗？`,
    ]
    return topicPhrases[Math.floor(Math.random() * topicPhrases.length)]
  }
  
  return randomPhrase
}
