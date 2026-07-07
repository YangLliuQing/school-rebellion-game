<template>
  <div class="chat-page">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <div class="header-center">
        <h2 class="chalk-text">💬 班级群聊</h2>
        <span class="class-tag">{{ gameStore.currentClass?.name || '叛逆班级' }}</span>
      </div>
      <div class="online-count" v-if="mp.roomId">👥 {{ mp.roomPlayers.length }}</div>
      <div class="online-count" v-else>👥 {{ onlineCount }}</div>
    </div>

    <!-- 多人模式连接状态 -->
    <div class="connection-bar" v-if="mp.roomId">
      <ConnectionStatus />
    </div>

    <!-- 连接断开遮罩 -->
    <DisconnectOverlay 
      :visible="showDisconnect"
      :type="disconnectType"
      :message="disconnectMessage"
      @retry="handleRetry"
      @leave="handleLeaveRoom"
    />

    <!-- 聊天消息列表 -->
    <div class="chat-messages" ref="msgContainer">
      <div 
        class="msg-item"
        v-for="msg in gameStore.chatMessages"
        :key="msg.id"
        :class="{ 
          'is-player': msg.isPlayer && !msg.isAI, 
          'is-multiplayer': msg.isPlayer && !msg.isAI && mp.roomId,
          'is-ai': msg.isAI 
        }"
      >
        <div class="msg-avatar">{{ msg.avatar }}</div>
        <div class="msg-body">
          <div class="msg-header">
            <span class="msg-name">{{ msg.name }}</span>
            <span class="msg-tag" v-if="msg.personality">· {{ msg.personality }}</span>
            <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>
          </div>
          <div class="msg-content">{{ msg.content }}</div>
        </div>
      </div>
      
      <!-- AI正在输入提示 -->
      <div class="typing-indicator" v-if="typingVisible">
        <span>🤖</span> AI同学们正在输入...
      </div>
      
      <div ref="msgEnd"></div>
    </div>

    <!-- 输入区 -->
    <div class="chat-input-area safe-area-bottom">
      <div class="input-wrapper">
        <input
          v-model="inputMsg"
          type="text"
          class="chat-input"
          placeholder="输入消息..."
          maxlength="100"
          @keyup.enter="sendMessage"
        />
        <button 
          class="send-btn"
          :disabled="!inputMsg.trim()"
          @click="sendMessage"
        >
          发送
        </button>
      </div>
      <div class="quick-phrases">
        <button 
          class="phrase-btn" 
          v-for="phrase in quickPhrases" 
          :key="phrase"
          @click="sendQuickPhrase(phrase)"
        >
          {{ phrase }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/store/game'
import { useMultiplayerStore } from '@/store/multiplayer'
import { playMessageSound } from '@/utils/sound'
import ConnectionStatus from '@/components/ConnectionStatus.vue'
import DisconnectOverlay from '@/components/DisconnectOverlay.vue'

const gameStore = useGameStore()
const mp = useMultiplayerStore()
const inputMsg = ref('')
const typingVisible = ref(false)
const msgContainer = ref(null)
const msgEnd = ref(null)
const showDisconnect = ref(false)
const disconnectType = ref('disconnected')
const disconnectMessage = ref('')

const quickPhrases = [
  '老师来了！',
  '哈哈哈哈',
  '借我一支笔',
  '下课了吗？',
  '作业借我抄抄',
  '今天食堂吃啥？',
  '周末去哪玩？',
  '考试好难啊😭'
]

const onlineCount = computed(() => {
  return gameStore.allStudents.filter(s => s.isOnline).length
})

let typingTimer = null
let autoChatTimer = null

function sendMessage() {
  if (!inputMsg.value.trim()) return
  
  if (mp.roomId) {
    // 多人模式：通过 WebSocket 发送
    mp.sendChat(inputMsg.value.trim())
  } else {
    // 单人模式：本地发送
    gameStore.sendChatMessage(inputMsg.value.trim())
  }
  
  if (gameStore.soundEnabled) playMessageSound()
  inputMsg.value = ''
  scrollToBottom()
  
  // 显示AI正在输入（仅单人模式）
  if (!mp.roomId) {
    typingVisible.value = true
    clearTimeout(typingTimer)
    typingTimer = setTimeout(() => {
      typingVisible.value = false
    }, 2500)
  }
}

function sendQuickPhrase(phrase) {
  inputMsg.value = phrase
  sendMessage()
}

function formatTime(ts) {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function scrollToBottom() {
  nextTick(() => {
    msgEnd.value?.scrollIntoView({ behavior: 'smooth' })
  })
}

// 自动AI聊天（仅单人模式，多人模式由服务端处理）
onMounted(() => {
  scrollToBottom()
  
  if (!mp.roomId) {
    autoChatTimer = setInterval(() => {
      if (Math.random() < 0.5) {
        gameStore.generateAIReply()
        typingVisible.value = true
        clearTimeout(typingTimer)
        typingTimer = setTimeout(() => {
          typingVisible.value = false
          scrollToBottom()
        }, 2000)
      }
    }, 6000)
  }
})

onUnmounted(() => {
  clearInterval(autoChatTimer)
  clearTimeout(typingTimer)
})

// 监听多人模式连接状态
watch(() => mp.connected, (val) => {
  if (mp.roomId && !val && mp.reconnectAttempt === 0) {
    // 初始断开
    showDisconnect.value = true
    disconnectType.value = 'disconnected'
  }
})

watch(() => mp.reconnectFailed, (val) => {
  if (val) {
    showDisconnect.value = true
    disconnectType.value = 'reconnect_failed'
    disconnectMessage.value = `已尝试重连 ${mp.maxReconnectAttempts} 次均失败`
  }
})

watch(() => mp.lastError, (val) => {
  if (val) {
    if (val.includes('房间已满')) {
      showDisconnect.value = true
      disconnectType.value = 'room_full'
      disconnectMessage.value = val
    } else if (val.includes('房间不存在')) {
      showDisconnect.value = true
      disconnectType.value = 'room_not_found'
      disconnectMessage.value = val
    }
  }
})

function handleRetry() {
  showDisconnect.value = false
  mp.connect()
}

function handleLeaveRoom() {
  showDisconnect.value = false
  mp.disconnect()
}

watch(() => gameStore.chatMessages.length, () => {
  scrollToBottom()
})
</script>

<style scoped>
.chat-page {
  min-height: 100vh;
  background: var(--bg-dark);
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: rgba(0,0,0,0.4);
  flex-shrink: 0;
}

.header-center {
  text-align: center;
}

.header-center h2 {
  font-size: 18px;
}

.class-tag {
  font-size: 11px;
  color: var(--text-muted);
}

.back-btn {
  background: rgba(255,255,255,0.1);
  border: none;
  color: var(--text-primary);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
}

.online-count {
  font-size: 13px;
  color: var(--chalk-green);
}

.ban-notice {
  text-align: center;
  padding: 8px;
  background: rgba(224,122,95,0.2);
  color: #e07a5f;
  font-size: 13px;
  flex-shrink: 0;
}

/* 消息列表 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.msg-item {
  display: flex;
  gap: 10px;
  animation: slide-up 0.3s ease;
}

.msg-item.is-player {
  flex-direction: row-reverse;
}

.msg-avatar {
  font-size: 28px;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.msg-body {
  max-width: 70%;
}

.msg-header {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
  font-size: 11px;
}

.is-player .msg-header {
  flex-direction: row-reverse;
  text-align: right;
}

.msg-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 12px;
}

.msg-tag {
  color: var(--text-muted);
  font-size: 10px;
}

.msg-time {
  color: var(--text-muted);
  font-size: 10px;
  margin-left: auto;
}

.is-player .msg-time {
  margin-left: 0;
  margin-right: auto;
}

.msg-content {
  padding: 10px 14px;
  background: rgba(255,255,255,0.1);
  border-radius: 16px;
  border-top-left-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
  word-break: break-word;
}

.is-player .msg-content {
  background: linear-gradient(135deg, #e07a5f, #c0603f);
  border-radius: 16px;
  border-top-right-radius: 4px;
}

.typing-indicator {
  font-size: 12px;
  color: var(--text-muted);
  padding: 8px;
  text-align: left;
  animation: pulse 1.5s ease-in-out infinite;
}

/* 输入区 */
.chat-input-area {
  padding: 10px 16px;
  background: rgba(0,0,0,0.5);
  border-top: 1px solid rgba(255,255,255,0.1);
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  gap: 8px;
}

.chat-input {
  flex: 1;
  padding: 10px 14px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 20px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.chat-input:disabled {
  opacity: 0.5;
}

.send-btn {
  padding: 10px 20px;
  background: var(--chalk-yellow);
  border: none;
  border-radius: 20px;
  color: #1a1a2e;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

.send-btn:disabled {
  background: rgba(255,255,255,0.2);
  color: var(--text-muted);
}

.quick-phrases {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.phrase-btn {
  padding: 4px 10px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 14px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.phrase-btn:active {
  background: rgba(255,255,255,0.15);
}

.connection-bar {
  padding: 0 16px 4px;
}

/* 多人消息高亮 */
.msg-item.is-multiplayer .msg-content {
  border: 2px solid rgba(129,178,154,0.5);
  box-shadow: 0 0 8px rgba(129,178,154,0.2);
}

.msg-item.is-ai .msg-content {
  background: rgba(255,255,255,0.05);
  border: 1px dashed rgba(255,255,255,0.1);
}
</style>
