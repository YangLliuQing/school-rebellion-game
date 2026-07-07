<template>
  <div class="connection-status" :class="statusClass">
    <span class="status-dot"></span>
    <span class="status-text">{{ statusText }}</span>
    <span class="room-info" v-if="mp.roomId">
      房间: {{ mp.roomId }} | {{ mp.roomPlayers.length }}人在线
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMultiplayerStore } from '@/store/multiplayer'

const mp = useMultiplayerStore()

const statusClass = computed(() => {
  if (mp.connected) return 'connected'
  if (mp.reconnectAttempt > 0 && !mp.reconnectFailed) return 'reconnecting'
  return 'disconnected'
})

const statusText = computed(() => {
  if (mp.connected) return '已连接'
  if (mp.reconnectAttempt > 0 && !mp.reconnectFailed) 
    return `重连中 (${mp.reconnectAttempt}/10)...`
  return '未连接'
})
</script>

<style scoped>
.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  background: rgba(0,0,0,0.3);
}

.connected {
  color: #4ade80;
}

.reconnecting {
  color: #fbbf24;
  animation: pulse 1s ease-in-out infinite;
}

.disconnected {
  color: #f87171;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.connected .status-dot {
  background: #4ade80;
  box-shadow: 0 0 6px #4ade80;
}

.reconnecting .status-dot {
  background: #fbbf24;
  box-shadow: 0 0 6px #fbbf24;
}

.disconnected .status-dot {
  background: #f87171;
}

.status-text {
  white-space: nowrap;
}

.room-info {
  color: var(--text-muted);
  margin-left: 4px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
