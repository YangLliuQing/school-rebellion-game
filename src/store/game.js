import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  generateClass,
  getCurrentPeriod,
  getClassStatus,
  generateAIChatMessage,
  generateSchedule,
  QUESTION_BANK,
  PERSONALITY_TYPES
} from '@/data/gameData'

export const useGameStore = defineStore('game', () => {
  // ===== 玩家状态 =====
  const playerName = ref('')
  const playerScore = ref(0)
  const playerPersonality = ref(null)
  const hasCompletedSetup = ref(false)
  const streakCount = ref(0) // 连击

  // ===== 班级状态 =====
  const currentClass = ref(null)
  const schedule = ref([])
  const currentPeriod = ref(null)
  const classStatus = ref('after_school') // in_class | break | after_school

  // ===== 聊天状态 =====
  const chatMessages = ref([])
  const chatBanned = ref(false)
  let chatMsgId = 0

  // ===== 答题状态 =====
  const currentQuestion = ref(null)
  const quizActive = ref(false)
  const quizResults = ref([]) // 本轮答题结果
  const lastQuizResult = ref(null) // 最近一次答题结果

  // ===== 排行榜 =====
  const topStudents = ref([])
  const rebelRanking = ref([])

  // ===== 音效 =====
  const soundEnabled = ref(true)
  const bgmEnabled = ref(true)

  // ===== 计算属性 =====
  const allStudents = computed(() => currentClass.value?.students || [])
  
  const sortedByScore = computed(() => {
    return [...allStudents.value].sort((a, b) => b.score - a.score)
  })

  const playerRank = computed(() => {
    const allScores = [...allStudents.value.map(s => ({ name: s.name, score: s.score, isPlayer: false }))]
    allScores.push({ name: playerName.value || '我', score: playerScore.value, isPlayer: true })
    allScores.sort((a, b) => b.score - a.score)
    return allScores.findIndex(s => s.isPlayer) + 1
  })

  const rebelScore = computed(() => {
    // 叛逆分 = 摸鱼越多越高
    return Math.max(0, 100 - (playerScore.value % 100))
  })

  // ===== 初始化游戏 =====
  function initGame() {
    // 尝试从本地存储恢复
    const saved = loadGame()
    if (saved) {
      restoreGame(saved)
    }
  }

  function setupPlayer(name) {
    playerName.value = name
    hasCompletedSetup.value = true
    
    // 随机分配人格
    const randomPersonality = PERSONALITY_TYPES[Math.floor(Math.random() * PERSONALITY_TYPES.length)]
    playerPersonality.value = randomPersonality
    
    // 生成班级
    const grade = ['初一', '初二', '初三'][Math.floor(Math.random() * 3)]
    currentClass.value = generateClass(`${grade}3班`, grade)
    schedule.value = currentClass.value.schedule
    
    // 刷新状态
    refreshStatus()
    
    // 生成初始聊天
    generateInitialChat()
    
    // 保存
    saveGame()
  }

  function refreshStatus() {
    if (!schedule.value.length) return
    currentPeriod.value = getCurrentPeriod(schedule.value)
    classStatus.value = getClassStatus(schedule.value)
    chatBanned.value = classStatus.value === 'in_class'
    
    // 更新排行榜
    updateRankings()
  }

  function updateRankings() {
    if (!currentClass.value) return
    const students = [...currentClass.value.students]
    topStudents.value = students.sort((a, b) => b.score - a.score).slice(0, 10)
    rebelRanking.value = students.sort((a, b) => (b.score % 100) - (a.score % 100)).slice(0, 10)
  }

  // ===== 答题系统 =====
  function startQuiz() {
    if (quizActive.value) return
    
    // 随机选题
    const pool = [...QUESTION_BANK].sort(() => Math.random() - 0.5)
    currentQuestion.value = pool[0]
    quizActive.value = true
    quizResults.value = []
    lastQuizResult.value = null
    
    // AI同学模拟答题
    simulateAIAnswers(pool[0])
  }

  function submitAnswer(answerIndex) {
    if (!quizActive.value || !currentQuestion.value) return
    
    const question = currentQuestion.value
    const isCorrect = answerIndex === question.answer
    
    if (isCorrect) {
      streakCount.value++
      const bonus = streakCount.value > 3 ? question.points * 2 : question.points
      playerScore.value += bonus
      lastQuizResult.value = { correct: true, points: bonus, streak: streakCount.value }
    } else {
      streakCount.value = 0
      lastQuizResult.value = { correct: false, points: 0, streak: 0 }
    }
    
    quizActive.value = false
    
    // 随机下一个问题
    setTimeout(() => {
      currentQuestion.value = null
    }, 2000)
    
    updateRankings()
    saveGame()
  }

  function simulateAIAnswers(question) {
    if (!currentClass.value) return
    
    const results = []
    currentClass.value.students.forEach(student => {
      const accuracy = student.personality.answerAccuracy
      const isCorrect = Math.random() < accuracy
      const pointsEarned = isCorrect ? question.points : 0
      
      if (isCorrect) {
        student.score += pointsEarned
      }
      
      results.push({
        studentId: student.id,
        name: student.name,
        correct: isCorrect,
        points: pointsEarned
      })
    })
    
    quizResults.value = results
  }

  function getNextQuestion() {
    const pool = [...QUESTION_BANK].sort(() => Math.random() - 0.5)
    currentQuestion.value = pool[0]
    quizActive.value = true
    quizResults.value = []
    lastQuizResult.value = null
    simulateAIAnswers(pool[0])
  }

  // ===== 聊天系统 =====
  function generateInitialChat() {
    if (!currentClass.value) return
    
    const msgs = []
    // 生成几条初始AI消息
    const activeStudents = currentClass.value.students
      .filter(s => s.isOnline && s.personality.chatFrequency > 0.5)
      .sort(() => Math.random() - 0.5)
      .slice(0, 8)
    
    activeStudents.forEach((student, i) => {
      msgs.push({
        id: ++chatMsgId,
        studentId: student.id,
        name: student.name,
        avatar: student.personality.emoji,
        content: generateAIChatMessage(student),
        timestamp: Date.now() - (activeStudents.length - i) * 30000,
        isPlayer: false,
        personality: student.personality.name
      })
    })
    
    chatMessages.value = msgs.sort((a, b) => a.timestamp - b.timestamp)
  }

  function sendChatMessage(content) {
    if (!content.trim()) return
    if (chatBanned.value) return // 上课禁言
    
    const msg = {
      id: ++chatMsgId,
      studentId: 'player',
      name: playerName.value || '我',
      avatar: playerPersonality.value?.emoji || '😎',
      content: content.trim(),
      timestamp: Date.now(),
      isPlayer: true,
      personality: playerPersonality.value?.name || '转学生'
    }
    
    chatMessages.value.push(msg)
    
    // AI同学随机回复
    setTimeout(() => {
      generateAIReply()
    }, 1000 + Math.random() * 3000)
    
    // 限制消息数量
    if (chatMessages.value.length > 200) {
      chatMessages.value = chatMessages.value.slice(-150)
    }
    
    saveGame()
  }

  function generateAIReply() {
    if (!currentClass.value) return
    
    const activeStudents = currentClass.value.students.filter(s => s.isOnline)
    const repliers = activeStudents
      .filter(s => Math.random() < s.personality.chatFrequency)
      .slice(0, 2)
    
    repliers.forEach(student => {
      const msg = {
        id: ++chatMsgId,
        studentId: student.id,
        name: student.name,
        avatar: student.personality.emoji,
        content: generateAIChatMessage(student),
        timestamp: Date.now(),
        isPlayer: false,
        personality: student.personality.name
      }
      chatMessages.value.push(msg)
    })
    
    // 限制消息数量
    if (chatMessages.value.length > 200) {
      chatMessages.value = chatMessages.value.slice(-150)
    }
  }

  function autoGenerateChat() {
    // 定时自动生成AI聊天
    if (chatBanned.value) return
    
    const shouldGenerate = Math.random() < 0.3
    if (!shouldGenerate) return
    
    generateAIReply()
  }

  // ===== 课表系统 =====
  function refreshSchedule() {
    schedule.value = generateSchedule()
    if (currentClass.value) {
      currentClass.value.schedule = schedule.value
    }
    refreshStatus()
    saveGame()
  }

  // ===== 音效 =====
  function toggleSound() {
    soundEnabled.value = !soundEnabled.value
  }

  function toggleBgm() {
    bgmEnabled.value = !bgmEnabled.value
  }

  // ===== 数据持久化 =====
  function saveGame() {
    try {
      const data = {
        playerName: playerName.value,
        playerScore: playerScore.value,
        playerPersonality: playerPersonality.value,
        hasCompletedSetup: hasCompletedSetup.value,
        streakCount: streakCount.value,
        currentClass: currentClass.value,
        schedule: schedule.value,
        chatMessages: chatMessages.value.slice(-50), // 只保存最近50条
        soundEnabled: soundEnabled.value,
        bgmEnabled: bgmEnabled.value,
        savedAt: Date.now()
      }
      localStorage.setItem('school_game_save', JSON.stringify(data))
    } catch (e) {
      console.warn('保存失败:', e)
    }
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem('school_game_save')
      if (!raw) return null
      const data = JSON.parse(raw)
      // 24小时内有效
      if (Date.now() - data.savedAt > 24 * 60 * 60 * 1000) return null
      return data
    } catch (e) {
      return null
    }
  }

  function restoreGame(data) {
    playerName.value = data.playerName
    playerScore.value = data.playerScore
    playerPersonality.value = data.playerPersonality
    hasCompletedSetup.value = data.hasCompletedSetup
    streakCount.value = data.streakCount || 0
    currentClass.value = data.currentClass
    schedule.value = data.schedule
    chatMessages.value = data.chatMessages || []
    soundEnabled.value = data.soundEnabled !== false
    bgmEnabled.value = data.bgmEnabled !== false
    
    if (schedule.value.length) {
      refreshStatus()
    }
  }

  function resetGame() {
    playerName.value = ''
    playerScore.value = 0
    playerPersonality.value = null
    hasCompletedSetup.value = false
    streakCount.value = 0
    currentClass.value = null
    schedule.value = []
    currentPeriod.value = null
    classStatus.value = 'after_school'
    chatMessages.value = []
    quizActive.value = false
    currentQuestion.value = null
    quizResults.value = []
    lastQuizResult.value = null
    chatMsgId = 0
    
    try {
      localStorage.removeItem('school_game_save')
    } catch (e) {}
  }

  // ===== 定时刷新 =====
  setInterval(() => {
    if (hasCompletedSetup.value) {
      refreshStatus()
      autoGenerateChat()
    }
  }, 30000) // 每30秒刷新一次状态

  return {
    // state
    playerName,
    playerScore,
    playerPersonality,
    hasCompletedSetup,
    streakCount,
    currentClass,
    schedule,
    currentPeriod,
    classStatus,
    chatMessages,
    chatBanned,
    currentQuestion,
    quizActive,
    quizResults,
    lastQuizResult,
    topStudents,
    rebelRanking,
    soundEnabled,
    bgmEnabled,
    
    // computed
    allStudents,
    sortedByScore,
    playerRank,
    rebelScore,
    
    // actions
    initGame,
    setupPlayer,
    refreshStatus,
    startQuiz,
    submitAnswer,
    getNextQuestion,
    sendChatMessage,
    refreshSchedule,
    toggleSound,
    toggleBgm,
    saveGame,
    resetGame,
    generateAIReply
  }
})
