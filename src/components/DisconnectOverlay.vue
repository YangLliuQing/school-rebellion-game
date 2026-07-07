<template>
  <div class="disconnect-overlay" v-if="visible">
    <div class="disconnect-card chalk-border">
      <div class="disconnect-icon">{{ icon }}</div>
      <h3 class="disconnect-title">{{ title }}</h3>
      <p class="disconnect-desc">{{ description }}</p>
      <div class="disconnect-actions">
        <button class="btn btn-primary" @click="handleRetry" :disabled="retrying">
          {{ retrying ? '重连中...' : actionLabel }}
        </button>
        <button class="btn btn-chalk" @click="handleLeave" v-if="canLeave">
          离开房间
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useMultiplayerStore } from '@/store/multiplayer'
import { useRouter } from 'vue-router'

const props = defineProps({
  visible: Boolean,
  type: {
    type: String,
    default: 'disconnected', // 'disconnected' | 'reconnect_failed' | 'room_full' | 'room_not_found'
  },
  message: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['retry', 'leave'])
const mp = useMultiplayerStore()
const router = useRouter()
const retrying = ref(false)

const icon = computed(() => {
  switch (props.type) {
    case 'room_full': return '🚫'
    case 'room_not_found': return '🔍'
    case 'reconnect_failed': return '💔'
    default: return '🔌'
  }
})

const title = computed(() => {
  switch (props.type) {
    case 'room_full': return '房间已满'
    case 'room_not_found': return '房间不存在'
    case 'reconnect_failed': return '连接已断开'
    default: return '与服务器断开连接'
  }
})

const description = computed(() => {
  if (props.message) return props.message
  switch (props.type) {
    case 'room_full': return '该房间已达到最大人数（8人），请创建新房间或稍后再试'
    case 'room_not_found': return '房间号不存在或已过期，请确认房间号是否正确'
    case 'reconnect_failed': return '多次重连失败，请检查网络连接后手动重连'
    default: return '网络连接中断，请检查网络后重连'
  }
})

const actionLabel = computed(() => {
  switch (props.type) {
    case 'room_full':
    case 'room_not_found': return '返回大厅'
    default: return '重新连接'
  }
})

const canLeave = computed(() => {
  return props.type === 'disconnected' || props.type === 'reconnect_failed'
})

function handleRetry() {
  retrying.value = true
  
  if (props.type === 'room_full' || props.type === 'room_not_found') {
    emit('leave')
    router.push('/')
    return
  }
  
  emit('retry')
  // 超时重置按钮
  setTimeout(() => { retrying.value = false }, 15000)
}

function handleLeave() {
  mp.disconnect()
  emit('leave')
  router.push('/')
}
</script>

<style scoped>
.disconnect-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.disconnect-card {
  background: #1a1a2e;
  border: 3px solid rgba(255,255,255,0.2);
  border-radius: 20px;
  padding: 32px 24px;
  width: 100%;
  max-width: 340px;
  text-align: center;
  box-shadow: 0 0 40px rgba(0,0,0,0.6);
}

.disconnect-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.disconnect-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--chalk-yellow);
  margin-bottom: 8px;
}

.disconnect-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 24px;
  line-height: 1.6;
}

.disconnect-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.disconnect-actions .btn {
  padding: 12px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  width: 100%;
}

.disconnect-actions .btn-primary {
  background: linear-gradient(135deg, #f0e68c, #d4c56a);
  color: #1a1a2e;
}

.disconnect-actions .btn-chalk {
  background: rgba(255,255,255,0.08);
  color: var(--text-muted);
  border: 1px solid rgba(255,255,255,0.15);
}

.disconnect-actions .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
