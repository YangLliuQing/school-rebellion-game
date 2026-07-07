/**
 * 答题处理器
 */

const { QUESTION_BANK, randomPick } = require('./gameData')
const { getRoom, broadcastAll } = require('./roomManager')

function handleStartQuiz(roomId, playerId) {
  const room = getRoom(roomId)
  if (!room) return
  
  // 防止重复答题
  if (room.quizState && room.quizState.active) return
  
  const question = randomPick(QUESTION_BANK)
  
  room.quizState = {
    active: true,
    question,
    startTime: Date.now(),
    timeLimit: 15000,
    answers: new Map(),     // playerId -> { answerIndex, timestamp }
    answered: new Set()
  }
  
  // 广播答题开始
  broadcastAll(roomId, {
    type: 'quiz:start',
    payload: {
      questionId: question.id,
      question: question.question,
      options: question.options,
      category: question.category,
      timeLimit: 15,
      startTime: room.quizState.startTime
    }
  })
  
  // 15秒后自动结束
  setTimeout(() => {
    endQuiz(roomId)
  }, 15500)
}

function handleAnswer(roomId, playerId, payload) {
  const room = getRoom(roomId)
  if (!room || !room.quizState || !room.quizState.active) return
  
  const qs = room.quizState
  
  // 已经答过
  if (qs.answered.has(playerId)) return
  
  qs.answered.add(playerId)
  qs.answers.set(playerId, {
    answerIndex: payload.answerIndex,
    timestamp: Date.now()
  })
  
  // 通知该玩家答案已提交
  const player = room.players.get(playerId)
  // 广播当前进度
  broadcastAll(roomId, {
    type: 'quiz:progress',
    payload: {
      answered: qs.answered.size,
      total: room.players.size
    }
  })
  
  // 所有人都答完了
  if (qs.answered.size >= room.players.size) {
    endQuiz(roomId)
  }
}

function endQuiz(roomId) {
  const room = getRoom(roomId)
  if (!room || !room.quizState) return
  
  const qs = room.quizState
  const question = qs.question
  
  // 计算玩家结果
  const playerResults = []
  room.players.forEach(player => {
    const ans = qs.answers.get(player.playerId)
    const isCorrect = ans ? ans.answerIndex === question.answer : false
    const points = isCorrect ? question.points : 0
    
    if (isCorrect) {
      player.score += points
    }
    
    playerResults.push({
      playerId: player.playerId,
      playerName: player.playerName,
      emoji: player.emoji,
      correct: isCorrect,
      points,
      score: player.score,
      answered: !!ans,
      answerIndex: ans ? ans.answerIndex : -1
    })
  })
  
  // AI学生结果模拟
  const aiResults = room.aiStudents.slice(0, 10).map(ai => {
    const accuracy = ai.personality.answerAccuracy
    const isCorrect = Math.random() < accuracy
    const points = isCorrect ? question.points : 0
    if (isCorrect) ai.score += points
    return {
      playerId: ai.id,
      playerName: ai.name,
      emoji: ai.personality.emoji,
      correct: isCorrect,
      points,
      isAI: true
    }
  })
  
  // 按得分排序
  playerResults.sort((a, b) => b.score - a.score)
  
  // 广播结果
  broadcastAll(roomId, {
    type: 'quiz:result',
    payload: {
      questionId: question.id,
      correctAnswer: question.answer,
      explanation: question.options[question.answer],
      players: playerResults,
      aiResults,
      points: question.points
    }
  })
  
  // 广播分数更新
  playerResults.forEach(pr => {
    if (pr.correct) {
      broadcastAll(roomId, {
        type: 'score:update',
        payload: {
          playerId: pr.playerId,
          playerName: pr.playerName,
          score: pr.score,
          reason: `答对「${question.question}」 +${pr.points}分`
        }
      })
    }
  })
  
  // 清除答题状态
  room.quizState = null
}

module.exports = { handleStartQuiz, handleAnswer, endQuiz }
