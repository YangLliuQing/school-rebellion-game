/**
 * 房间管理器
 * 负责房间的创建、加入、离开、销毁
 */

const { generateRoomId, generateStudent, generateId } = require('./gameData')

// 全局房间存储
const rooms = new Map()

// 房间清理定时器
const ROOM_CLEANUP_INTERVAL = 5 * 60 * 1000 // 5分钟无活跃连接后清理

function getRoom(roomId) {
  return rooms.get(roomId) || null
}

function createRoom() {
  const roomId = generateRoomId()
  
  // 生成40个AI学生
  const aiStudents = []
  for (let i = 0; i < 40; i++) {
    aiStudents.push(generateStudent())
  }
  
  const room = {
    roomId,
    createdAt: Date.now(),
    players: new Map(),     // playerId -> { playerId, playerName, emoji, personality, score, seatRow, seatCol, ws }
    aiStudents,
    chatMessages: [],
    quizState: null,
    maxPlayers: 8,
    status: 'waiting',      // 'waiting' | 'playing'
    aiChatTimer: null,
    cleanupTimer: null
  }
  
  rooms.set(roomId, room)
  
  // 启动AI自动聊天
  startAIChat(room)
  
  console.log(`[Room] 房间 ${roomId} 已创建`)
  return room
}

function joinRoom(roomId, playerData, ws) {
  const room = rooms.get(roomId)
  if (!room) {
    return { error: '房间不存在或已过期' }
  }
  
  if (room.players.size >= room.maxPlayers) {
    return { error: '房间已满（最多8人）' }
  }
  
  // 检查重复加入
  if (room.players.has(playerData.playerId)) {
    // 踢掉旧连接
    const oldPlayer = room.players.get(playerData.playerId)
    try { oldPlayer.ws.close() } catch (e) {}
  }
  
  // 分配座位
  const seat = assignSeat(room)
  if (!seat) {
    return { error: '没有空余座位' }
  }
  
  const player = {
    playerId: playerData.playerId,
    playerName: playerData.playerName,
    emoji: playerData.emoji || '😎',
    personality: playerData.personality || null,
    score: 0,
    seatRow: seat.row,
    seatCol: seat.col,
    ws,
    connectedAt: Date.now()
  }
  
  room.players.set(playerData.playerId, player)
  room.status = 'playing'
  
  // 清除清理定时器
  if (room.cleanupTimer) {
    clearTimeout(room.cleanupTimer)
    room.cleanupTimer = null
  }
  
  console.log(`[Room] ${playerData.playerName} 加入房间 ${roomId} (${room.players.size}/${room.maxPlayers})`)
  
  return {
    success: true,
    room: {
      roomId: room.roomId,
      players: Array.from(room.players.values()).map(p => ({
        playerId: p.playerId,
        playerName: p.playerName,
        emoji: p.emoji,
        score: p.score,
        seatRow: p.seatRow,
        seatCol: p.seatCol
      })),
      aiStudents: room.aiStudents.map(s => ({
        id: s.id,
        name: s.name,
        emoji: s.personality.emoji,
        personalityName: s.personality.name
      })),
      chatHistory: room.chatMessages.slice(-50),
      maxPlayers: room.maxPlayers
    }
  }
}

function leaveRoom(roomId, playerId) {
  const room = rooms.get(roomId)
  if (!room) return null
  
  const player = room.players.get(playerId)
  if (!player) return null
  
  room.players.delete(playerId)
  
  console.log(`[Room] ${player.playerName} 离开房间 ${roomId} (${room.players.size}人)`)
  
  // 如果房间空了，设置清理定时器
  if (room.players.size === 0) {
    room.cleanupTimer = setTimeout(() => {
      destroyRoom(roomId)
    }, ROOM_CLEANUP_INTERVAL)
  }
  
  return {
    playerId,
    playerName: player.playerName,
    remainingPlayers: room.players.size
  }
}

function destroyRoom(roomId) {
  const room = rooms.get(roomId)
  if (!room) return
  
  // 清除AI聊天定时器
  if (room.aiChatTimer) {
    clearInterval(room.aiChatTimer)
  }
  
  // 关闭所有连接
  room.players.forEach(p => {
    try { p.ws.close() } catch (e) {}
  })
  
  rooms.delete(roomId)
  console.log(`[Room] 房间 ${roomId} 已销毁`)
}

function assignSeat(room) {
  // 5行8列网格，找空位
  const occupied = new Set()
  room.players.forEach(p => {
    occupied.add(`${p.seatRow}-${p.seatCol}`)
  })
  
  // 随机尝试分配
  const seats = []
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 8; col++) {
      if (!occupied.has(`${row}-${col}`)) {
        seats.push({ row, col })
      }
    }
  }
  
  if (seats.length === 0) return null
  
  return seats[Math.floor(Math.random() * seats.length)]
}

function broadcastToRoom(roomId, message, excludePlayerId = null) {
  const room = rooms.get(roomId)
  if (!room) return
  
  const msgStr = JSON.stringify(message)
  room.players.forEach(player => {
    if (player.playerId !== excludePlayerId && player.ws.readyState === 1) {
      try {
        player.ws.send(msgStr)
      } catch (e) {
        console.error(`[Room] 发送消息失败: ${player.playerName}`, e.message)
      }
    }
  })
}

function sendToPlayer(roomId, playerId, message) {
  const room = rooms.get(roomId)
  if (!room) return
  
  const player = room.players.get(playerId)
  if (player && player.ws.readyState === 1) {
    try {
      player.ws.send(JSON.stringify(message))
    } catch (e) {
      console.error(`[Room] 发送消息失败: ${player.playerName}`, e.message)
    }
  }
}

function broadcastAll(roomId, message) {
  const room = rooms.get(roomId)
  if (!room) return
  
  const msgStr = JSON.stringify(message)
  room.players.forEach(player => {
    if (player.ws.readyState === 1) {
      try {
        player.ws.send(msgStr)
      } catch (e) {}
    }
  })
}

function getRoomPlayers(roomId) {
  const room = rooms.get(roomId)
  if (!room) return []
  
  return Array.from(room.players.values()).map(p => ({
    playerId: p.playerId,
    playerName: p.playerName,
    emoji: p.emoji,
    score: p.score,
    seatRow: p.seatRow,
    seatCol: p.seatCol
  }))
}

// ===== AI 自动聊天 =====
const { generateAIChatMessage } = require('./gameData')

function startAIChat(room) {
  if (room.aiChatTimer) return
  
  room.aiChatTimer = setInterval(() => {
    if (Math.random() < 0.5 && room.players.size > 0) {
      // 随机选1-2个AI学生发言
      const count = Math.random() > 0.6 ? 2 : 1
      for (let i = 0; i < count; i++) {
        const ai = room.aiStudents[Math.floor(Math.random() * room.aiStudents.length)]
        const msg = {
          type: 'chat:broadcast',
          payload: {
            messageId: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            playerId: ai.id,
            playerName: ai.name,
            emoji: ai.personality.emoji,
            content: generateAIChatMessage(ai),
            isPlayer: false,
            isAI: true,
            personality: ai.personality.name,
            timestamp: Date.now()
          }
        }
        
        room.chatMessages.push(msg.payload)
        if (room.chatMessages.length > 200) {
          room.chatMessages = room.chatMessages.slice(-150)
        }
        
        broadcastAll(room.roomId, msg)
      }
    }
  }, 6000)
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  destroyRoom,
  getRoom,
  broadcastToRoom,
  broadcastAll,
  sendToPlayer,
  getRoomPlayers
}
