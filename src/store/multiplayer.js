/**
 * 多人游戏 Pinia Store
 * 管理 WebSocket 连接、房间状态、多人答题
 */

import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import GameWebSocket from '@/services/websocket'
import { setupMessageHandlers } from '@/services/messageHandler'

// WebSocket 服务地址（部署后替换为 CloudBase 云函数地址）
const WS_URL = import.meta.env.VITE_WS_URL || 'wss://localhost:9000'

export const useMultiplayerStore = defineStore('multiplayer', () => {
  // ===== 连接状态 =====
  const ws = ref(null)
  const connected = ref(false)
  const reconnectAttempt = ref(0)
  const reconnectFailed = ref(false)
  const maxReconnectAttempts = ref(10)
  const lastError = ref('')
  const maxPlayers = ref(8)

  // ===== 玩家身份 =====
  const playerId = ref(getOrCreatePlayerId())
  const playerName = ref('')
  const playerEmoji = ref('😎')

  // ===== 房间状态 =====
  const roomId = ref(null)
  const roomPlayers = ref([])        // 真人玩家
  const roomAIStudents = ref([])     // AI 学生
  const seatMap = reactive({})       // { "row-col": { playerId, emoji, isReal } }
  const chatHistory = ref([])
  const typingPlayers = reactive(new Map())

  // ===== 答题状态 =====
  const serverQuizActive = ref(false)
  const serverQuestion = ref(null)
  const serverQuizTimer = ref(15)
  const quizSubmitted = ref(false)
  const quizAnswered = ref(0)
  const quizTotal = ref(0)
  const lastQuizResult = ref(null)
  const quizAllResults = ref([])
  const correctAnswer = ref(-1)

  // ===== 初始聊天生成 =====
  function generateInitialChat() {
    const greetings = [
      '大家好！新同学来了！',
      '欢迎欢迎~',
      '又来新人了？',
      'hello！',
      '有人一起写作业吗',
      '这节是什么课啊',
      '困死了...',
      '下课去打球吗'
    ]
    // 本地生成几条初始消息（服务端也会同步）
    return greetings.slice(0, 5).map((text, i) => ({
      id: 'init_' + i,
      studentId: 'system',
      name: '系统消息',
      avatar: '📢',
      content: text,
      timestamp: Date.now() - (5 - i) * 10000,
      isPlayer: false,
      isAI: false
    }))
  }

  // ===== 连接管理 =====
  function connect(url = null) {
    const wsUrl = url || WS_URL
    ws.value = new GameWebSocket(wsUrl)
    setupMessageHandlers(ws.value)
    ws.value.connect(playerId.value, roomId.value)
  }

  function disconnect() {
    if (ws.value) {
      ws.value.disconnect()
      ws.value = null
    }
    connected.value = false
    roomId.value = null
    roomPlayers.value = []
    chatHistory.value = []
  }

  // ===== 房间操作 =====
  function createRoom(name, emoji, personality) {
    playerName.value = name
    playerEmoji.value = emoji || '😎'
    
    if (!ws.value || ws.value.status !== 'connected') {
      connect()
    }
    
    ws.value.send('room:create', {
      playerId: playerId.value,
      playerName: name,
      emoji: emoji || '😎',
      personality
    })
  }

  function joinRoom(code, name, emoji, personality) {
    playerName.value = name
    playerEmoji.value = emoji || '😎'
    
    if (!ws.value || ws.value.status !== 'connected') {
      connect()
    }
    
    ws.value.send('room:join', {
      roomId: code.toUpperCase(),
      playerId: playerId.value,
      playerName: name,
      emoji: emoji || '😎',
      personality
    })
  }

  function leaveRoom() {
    disconnect()
  }

  // ===== 聊天 =====
  function sendChat(content) {
    if (!ws.value || ws.value.status !== 'connected') return
    ws.value.send('chat:send', { content })
  }

  function sendTyping(isTyping) {
    if (!ws.value || ws.value.status !== 'connected') return
    ws.value.send('chat:typing', { isTyping })
  }

  // ===== 答题 =====
  function requestQuiz() {
    if (!ws.value || ws.value.status !== 'connected') return
    ws.value.send('quiz:request', {})
  }

  function submitAnswer(answerIndex) {
    if (!ws.value || ws.value.status !== 'connected') return
    if (quizSubmitted.value) return
    
    ws.value.send('quiz:answer', { answerIndex })
    quizSubmitted.value = true
  }

  // ===== 座位 =====
  function updateSeatMap() {
    // 由 messageHandler 自动更新 seatMap
  }

  function addPlayer(player) {
    if (!roomPlayers.value.find(p => p.playerId === player.playerId)) {
      roomPlayers.value.push(player)
    }
  }

  function removePlayer(pid) {
    roomPlayers.value = roomPlayers.value.filter(p => p.playerId !== pid)
  }

  // ===== 工具函数 =====
  function getOrCreatePlayerId() {
    try {
      let id = localStorage.getItem('school_game_player_id')
      if (!id) {
        id = 'p_' + crypto.randomUUID()
        localStorage.setItem('school_game_player_id', id)
      }
      return id
    } catch (e) {
      return 'p_' + Math.random().toString(36).substr(2, 10)
    }
  }

  return {
    // state
    ws, connected, reconnectAttempt, reconnectFailed, maxReconnectAttempts, lastError,
    playerId, playerName, playerEmoji,
    roomId, roomPlayers, roomAIStudents, seatMap, chatHistory, typingPlayers, maxPlayers,
    serverQuizActive, serverQuestion, serverQuizTimer,
    quizSubmitted, quizAnswered, quizTotal,
    lastQuizResult, quizAllResults, correctAnswer,

    // actions
    connect, disconnect,
    createRoom, joinRoom, leaveRoom,
    sendChat, sendTyping,
    requestQuiz, submitAnswer,
    updateSeatMap, addPlayer, removePlayer,
    generateInitialChat
  }
})
