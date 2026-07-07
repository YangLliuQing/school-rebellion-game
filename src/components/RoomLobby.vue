<template>
  <div class="room-lobby-overlay" v-if="visible">
    <div class="room-lobby chalk-border">
      <div class="lobby-header">
        <h2>👥 多人联机</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="lobby-tabs">
        <button 
          :class="{ active: tab === 'create' }" 
          @click="tab = 'create'"
        >创建房间</button>
        <button 
          :class="{ active: tab === 'join' }" 
          @click="tab = 'join'"
        >加入房间</button>
      </div>

      <!-- 创建房间 -->
      <div class="lobby-body" v-if="tab === 'create'">
        <p class="lobby-desc">创建一个新房间，把房间号分享给同学一起玩！</p>
        <button 
          class="action-btn primary"
          :disabled="creating"
          @click="handleCreate"
        >
          {{ creating ? '创建中...' : '🏫 创建教室' }}
        </button>
        <p class="lobby-hint" v-if="lastError">{{ lastError }}</p>
      </div>

      <!-- 加入房间 -->
      <div class="lobby-body" v-if="tab === 'join'">
        <p class="lobby-desc">输入同学分享的6位房间号加入游戏</p>
        <input 
          v-model="roomCode"
          type="text"
          class="room-input"
          placeholder="输入6位房间号"
          maxlength="6"
          @input="roomCode = roomCode.toUpperCase()"
        />
        <button 
          class="action-btn primary"
          :disabled="roomCode.length < 6 || joining"
          @click="handleJoin"
        >
          {{ joining ? '加入中...' : '🚪 加入教室' }}
        </button>
        <p class="lobby-hint error" v-if="lastError">{{ lastError }}</p>
      </div>

      <div class="lobby-footer">
        <button class="text-btn" @click="$emit('close')">返回单人模式</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useMultiplayerStore } from '@/store/multiplayer'
import { useGameStore } from '@/store/game'

const props = defineProps({
  visible: Boolean
})
const emit = defineEmits(['close', 'roomCreated', 'roomJoined'])

const mp = useMultiplayerStore()
const game = useGameStore()

const tab = ref('create')
const roomCode = ref('')
const creating = ref(false)
const joining = ref(false)
const lastError = ref('')

// 监听错误
mp.$subscribe(() => {
  if (mp.lastError) {
    lastError.value = mp.lastError
    creating.value = false
    joining.value = false
  }
})

// 监听连接成功
mp.$subscribe(() => {
  if (mp.roomId && creating.value) {
    creating.value = false
    emit('roomCreated', mp.roomId)
  }
  if (mp.roomId && joining.value) {
    joining.value = false
    emit('roomJoined', mp.roomId)
  }
})

function handleCreate() {
  if (creating.value) return
  creating.value = true
  lastError.value = ''
  
  mp.connect()
  
  // 等待连接后创建房间
  const checkConnect = setInterval(() => {
    if (mp.connected) {
      clearInterval(checkConnect)
      mp.createRoom(
        game.playerName || '同学',
        game.playerPersonality?.emoji || '😎',
        game.playerPersonality
      )
    }
  }, 200)
  
  // 超时处理
  setTimeout(() => {
    if (creating.value) {
      clearInterval(checkConnect)
      creating.value = false
      lastError.value = '连接服务器失败，请检查网络'
    }
  }, 10000)
}

function handleJoin() {
  if (roomCode.value.length < 6 || joining.value) return
  joining.value = true
  lastError.value = ''
  
  mp.connect()
  
  const checkConnect = setInterval(() => {
    if (mp.connected) {
      clearInterval(checkConnect)
      mp.joinRoom(
        roomCode.value,
        game.playerName || '同学',
        game.playerPersonality?.emoji || '😎',
        game.playerPersonality
      )
    }
  }, 200)
  
  setTimeout(() => {
    if (joining.value) {
      clearInterval(checkConnect)
      joining.value = false
      lastError.value = '连接服务器失败，请检查网络'
    }
  }, 10000)
}
</script>

<style scoped>
.room-lobby-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.room-lobby {
  background: #1a1a2e;
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 20px;
  padding: 24px;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 0 30px rgba(0,0,0,0.5);
}

.lobby-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.lobby-header h2 {
  color: #f0e68c;
  font-size: 20px;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 20px;
  cursor: pointer;
}

.lobby-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.lobby-tabs button {
  flex: 1;
  padding: 8px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
}

.lobby-tabs button.active {
  background: rgba(240,230,140,0.2);
  border-color: #f0e68c;
  color: #f0e68c;
}

.lobby-body {
  margin-bottom: 16px;
}

.lobby-desc {
  color: var(--text-muted);
  font-size: 13px;
  margin-bottom: 16px;
  text-align: center;
}

.room-input {
  width: 100%;
  padding: 14px;
  background: rgba(255,255,255,0.1);
  border: 2px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 24px;
  text-align: center;
  letter-spacing: 8px;
  margin-bottom: 12px;
  outline: none;
  text-transform: uppercase;
}

.room-input:focus {
  border-color: #f0e68c;
}

.action-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 8px;
}

.action-btn.primary {
  background: linear-gradient(135deg, #f0e68c, #d4c56a);
  color: #1a1a2e;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.lobby-hint {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}

.lobby-hint.error {
  color: #e07a5f;
}

.lobby-footer {
  text-align: center;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.text-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
}
</style>
