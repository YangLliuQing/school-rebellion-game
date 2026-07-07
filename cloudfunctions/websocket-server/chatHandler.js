/**
 * 聊天消息处理器
 */

const { generateAIChatMessage } = require('./gameData')
const { getRoom, broadcastAll } = require('./roomManager')

function handleChat(ws, playerId, roomId, payload) {
  const room = getRoom(roomId)
  if (!room) return
  
  const player = room.players.get(playerId)
  if (!player) return
  
  const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
  
  const msg = {
    type: 'chat:broadcast',
    payload: {
      messageId,
      playerId,
      playerName: player.playerName,
      emoji: player.emoji,
      content: payload.content,
      isPlayer: true,
      isAI: false,
      personality: player.personality?.name || '转学生',
      timestamp: Date.now()
    }
  }
  
  // 存入聊天记录
  room.chatMessages.push(msg.payload)
  if (room.chatMessages.length > 200) {
    room.chatMessages = room.chatMessages.slice(-150)
  }
  
  // 广播给所有人
  broadcastAll(roomId, msg)
  
  // AI 学生随机回复（1-4秒后）
  setTimeout(() => {
    if (!getRoom(roomId)) return
    
    const aiCount = Math.random() > 0.5 ? 2 : 1
    for (let i = 0; i < aiCount; i++) {
      const ai = room.aiStudents[Math.floor(Math.random() * room.aiStudents.length)]
      const aiMsg = {
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
      
      room.chatMessages.push(aiMsg.payload)
      broadcastAll(roomId, aiMsg)
    }
  }, 1000 + Math.random() * 3000)
}

module.exports = { handleChat }
