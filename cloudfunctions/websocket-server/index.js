/**
 * 叛逆校园 WebSocket 服务端
 * CloudBase 云函数版本 — 监听 9000 端口
 */

const WebSocket = require('ws')
const {
  createRoom, joinRoom, leaveRoom, getRoom,
  broadcastAll, sendToPlayer, getRoomPlayers
} = require('./roomManager')
const { handleChat } = require('./chatHandler')
const { handleStartQuiz, handleAnswer } = require('./quizHandler')

const PORT = process.env.PORT || 9000
const wss = new WebSocket.Server({ port: PORT })

console.log(`[Server] WebSocket 服务已启动，端口: ${PORT}`)

wss.on('connection', (ws) => {
  let playerId = null
  let roomId = null
  
  console.log('[Server] 新连接建立')
  
  ws.on('message', (raw) => {
    let msg
    try {
      msg = JSON.parse(raw.toString())
    } catch (e) {
      console.error('[Server] 无效的JSON消息')
      return
    }
    
    const { type, payload = {} } = msg
    
    switch (type) {
      
      // ===== 房间管理 =====
      case 'room:create': {
        const room = createRoom()
        const result = joinRoom(room.roomId, {
          playerId: payload.playerId,
          playerName: payload.playerName,
          emoji: payload.emoji,
          personality: payload.personality
        }, ws)
        
        if (result.success) {
          playerId = payload.playerId
          roomId = room.roomId
          
          sendToPlayer(roomId, playerId, {
            type: 'room:created',
            payload: result.room
          })
        } else {
          ws.send(JSON.stringify({
            type: 'room:error',
            payload: { code: 'CREATE_FAILED', message: result.error }
          }))
        }
        break
      }
      
      case 'room:join': {
        const room = getRoom(payload.roomId)
        if (!room) {
          ws.send(JSON.stringify({
            type: 'room:error',
            payload: { code: 'ROOM_NOT_FOUND', message: '房间不存在' }
          }))
          return
        }
        
        const result = joinRoom(payload.roomId, {
          playerId: payload.playerId,
          playerName: payload.playerName,
          emoji: payload.emoji,
          personality: payload.personality
        }, ws)
        
        if (result.success) {
          playerId = payload.playerId
          roomId = payload.roomId
          
          // 发给加入者完整状态
          sendToPlayer(roomId, playerId, {
            type: 'room:joined',
            payload: result.room
          })
          
          // 广播给其他人
          const newPlayer = room.players.get(playerId)
          broadcastAll(roomId, {
            type: 'room:player_joined',
            payload: {
              playerId,
              playerName: payload.playerName,
              emoji: payload.emoji,
              seatRow: newPlayer.seatRow,
              seatCol: newPlayer.seatCol
            }
          })
          
          // 同步座位
          broadcastAll(roomId, {
            type: 'classroom:seats',
            payload: { seats: getSeatMap(room) }
          })
        } else {
          ws.send(JSON.stringify({
            type: 'room:error',
            payload: { code: 'JOIN_FAILED', message: result.error }
          }))
        }
        break
      }
      
      case 'room:reconnect': {
        const room = getRoom(payload.roomId)
        if (!room || !room.players.has(payload.playerId)) {
          ws.send(JSON.stringify({
            type: 'room:error',
            payload: { code: 'RECONNECT_FAILED', message: '重连失败，房间不存在' }
          }))
          return
        }
        
        playerId = payload.playerId
        roomId = payload.roomId
        
        // 更新连接
        const player = room.players.get(playerId)
        player.ws = ws
        
        // 发送完整状态
        sendToPlayer(roomId, playerId, {
          type: 'room:state',
          payload: {
            players: getRoomPlayers(roomId),
            aiStudents: room.aiStudents.map(s => ({
              id: s.id, name: s.name, emoji: s.personality.emoji, personalityName: s.personality.name
            })),
            chatHistory: room.chatMessages.slice(-50),
            quizState: room.quizState ? {
              active: room.quizState.active,
              questionId: room.quizState.question?.id,
              question: room.quizState.question?.question,
              options: room.quizState.question?.options,
              timeLimit: 15,
              startTime: room.quizState.startTime
            } : null,
            seats: getSeatMap(room)
          }
        })
        break
      }
      
      // ===== 聊天 =====
      case 'chat:send': {
        if (!roomId || !playerId) return
        handleChat(ws, playerId, roomId, payload)
        break
      }
      
      case 'chat:typing': {
        if (!roomId || !playerId) return
        const room = getRoom(roomId)
        if (!room) return
        const player = room.players.get(playerId)
        broadcastAll(roomId, {
          type: 'chat:typing_broadcast',
          payload: {
            playerId,
            playerName: player?.playerName,
            isTyping: payload.isTyping
          }
        })
        break
      }
      
      // ===== 答题 =====
      case 'quiz:request': {
        if (!roomId || !playerId) return
        handleStartQuiz(roomId, playerId)
        break
      }
      
      case 'quiz:answer': {
        if (!roomId || !playerId) return
        handleAnswer(roomId, playerId, payload)
        break
      }
      
      // ===== 心跳 =====
      case 'ping': {
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
        }
        break
      }
      
      default:
        console.log(`[Server] 未知消息类型: ${type}`)
    }
  })
  
  ws.on('close', () => {
    console.log('[Server] 连接断开', playerId)
    
    if (roomId && playerId) {
      const result = leaveRoom(roomId, playerId)
      if (result) {
        // 广播离开消息
        broadcastAll(roomId, {
          type: 'room:player_left',
          payload: {
            playerId,
            playerName: result.playerName,
            remainingPlayers: result.remainingPlayers
          }
        })
      }
    }
  })
  
  ws.on('error', (err) => {
    console.error('[Server] WebSocket 错误:', err.message)
  })
})

function getSeatMap(room) {
  const seats = []
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 8; col++) {
      const player = Array.from(room.players.values()).find(
        p => p.seatRow === row && p.seatCol === col
      )
      seats.push({
        row,
        col,
        playerId: player ? player.playerId : null,
        playerName: player ? player.playerName : null,
        emoji: player ? player.emoji : null,
        isReal: !!player
      })
    }
  }
  return seats
}

// 优雅退出
process.on('SIGTERM', () => {
  console.log('[Server] 收到退出信号，关闭服务...')
  wss.close(() => {
    process.exit(0)
  })
})
