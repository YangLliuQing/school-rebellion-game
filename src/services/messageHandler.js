/**
 * WebSocket 消息处理器
 * 将服务端推送的消息分发给 multiplayer store
 */

import { useMultiplayerStore } from '@/store/multiplayer'
import { useGameStore } from '@/store/game'
import { playMessageSound } from '@/utils/sound'

export function setupMessageHandlers(ws) {
  const mp = useMultiplayerStore()
  const game = useGameStore()

  // ===== 房间消息 =====
  ws.on('room:created', (payload) => {
    mp.roomId = payload.roomId
    mp.roomPlayers = payload.players
    mp.roomAIStudents = payload.aiStudents
    mp.chatHistory = payload.chatHistory || []
    mp.updateSeatMap()
  })

  ws.on('room:joined', (payload) => {
    mp.roomId = payload.roomId
    mp.roomPlayers = payload.players
    mp.roomAIStudents = payload.aiStudents
    mp.chatHistory = payload.chatHistory || []
    mp.updateSeatMap()
  })

  ws.on('room:player_joined', (payload) => {
    mp.addPlayer(payload)
    mp.updateSeatMap()
  })

  ws.on('room:player_left', (payload) => {
    mp.removePlayer(payload.playerId)
    mp.updateSeatMap()
  })

  ws.on('room:state', (payload) => {
    mp.roomPlayers = payload.players
    mp.roomAIStudents = payload.aiStudents
    mp.chatHistory = payload.chatHistory || []
    mp.seatMap = {}
    if (payload.seats) {
      payload.seats.forEach(s => {
        mp.seatMap[`${s.row}-${s.col}`] = s
      })
    }
    if (payload.quizState) {
      mp.serverQuizActive = payload.quizState.active
      mp.serverQuestion = payload.quizState
      mp.serverQuizTimer = Math.max(0, Math.ceil((payload.quizState.timeLimit * 1000 - (Date.now() - payload.quizState.startTime)) / 1000))
    }
  })

  ws.on('room:error', (payload) => {
    mp.lastError = payload.message || '未知错误'
    console.error('[MP] 房间错误:', payload)
  })

  // ===== 聊天消息 =====
  ws.on('chat:broadcast', (payload) => {
    // 同步到 game store 的 chatMessages
    game.chatMessages.push({
      id: payload.messageId,
      studentId: payload.playerId,
      name: payload.playerName,
      avatar: payload.emoji,
      content: payload.content,
      timestamp: payload.timestamp || Date.now(),
      isPlayer: payload.isPlayer,
      isAI: payload.isAI,
      personality: payload.personality
    })

    // 限制消息数量
    if (game.chatMessages.length > 200) {
      game.chatMessages = game.chatMessages.slice(-150)
    }

    // 播放新消息音效（非自己发的消息）
    if (game.soundEnabled && payload.playerId !== mp.playerId) {
      playMessageSound()
    }
  })

  ws.on('chat:typing_broadcast', (payload) => {
    if (payload.playerId !== mp.playerId) {
      mp.typingPlayers.set(payload.playerId, {
        playerName: payload.playerName,
        isTyping: payload.isTyping,
        timestamp: Date.now()
      })
      // 3秒后自动清除
      setTimeout(() => {
        mp.typingPlayers.delete(payload.playerId)
      }, 3000)
    }
  })

  // ===== 答题消息 =====
  ws.on('quiz:start', (payload) => {
    mp.serverQuizActive = true
    mp.serverQuestion = {
      questionId: payload.questionId,
      question: payload.question,
      options: payload.options,
      category: payload.category,
      startTime: payload.startTime
    }
    mp.serverQuizTimer = payload.timeLimit
    mp.quizSubmitted = false
    mp.quizAnswered = 0
    mp.quizTotal = 0
    mp.lastQuizResult = null
    mp.quizAllResults = []
  })

  ws.on('quiz:progress', (payload) => {
    mp.quizAnswered = payload.answered
    mp.quizTotal = payload.total
  })

  ws.on('quiz:result', (payload) => {
    mp.serverQuizActive = false
    mp.quizAllResults = [...payload.players, ...payload.aiResults]
    mp.correctAnswer = payload.correctAnswer

    // 找到自己的结果
    const myResult = payload.players.find(p => p.playerId === mp.playerId)
    if (myResult) {
      game.playerScore = myResult.score
      game.streakCount = myResult.correct ? game.streakCount + 1 : 0
      mp.lastQuizResult = {
        correct: myResult.correct,
        points: myResult.points,
        streak: game.streakCount
      }
    }
  })

  ws.on('score:update', (payload) => {
    // 更新对应玩家分数
    const player = mp.roomPlayers.find(p => p.playerId === payload.playerId)
    if (player) {
      player.score = payload.score
    }
    if (payload.playerId === mp.playerId) {
      game.playerScore = payload.score
    }
  })

  // ===== 座位消息 =====
  ws.on('classroom:seats', (payload) => {
    mp.seatMap = {}
    payload.seats.forEach(s => {
      mp.seatMap[`${s.row}-${s.col}`] = s
    })
  })

  // ===== 连接状态 =====
  ws.on('connection', (payload) => {
    mp.connected = payload.status === 'connected'
  })

  ws.on('reconnecting', (payload) => {
    mp.connected = false
    mp.reconnectAttempt = payload.attempt
    mp.maxReconnectAttempts = payload.maxAttempts || 10
  })

  ws.on('reconnect_failed', () => {
    mp.connected = false
    mp.reconnectFailed = true
  })
}
